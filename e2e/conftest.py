from __future__ import annotations

import os
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
import re
import uuid

import psycopg
import pytest
from dotenv import load_dotenv
from playwright.sync_api import Page, expect


ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = Path(__file__).resolve().parent / ".env.test"

if ENV_FILE.exists():
    load_dotenv(ENV_FILE)

BASE_URL = os.environ.get("PLAYWRIGHT_BASE_URL", "http://localhost:3000")
SERVER_STARTUP_TIMEOUT_S = 90


def _wait_for_server(url: str, timeout_s: int) -> None:
    deadline = time.monotonic() + timeout_s
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            urllib.request.urlopen(url, timeout=2)
            return
        except (urllib.error.URLError, ConnectionError, TimeoutError) as exc:
            last_error = exc
            time.sleep(1)
    raise RuntimeError(f"Next.js server did not become ready at {url} within {timeout_s}s") from last_error


@pytest.fixture(scope="session")
def base_url() -> str:
    """App URL under test. Overrides pytest-playwright's own --base-url handling below."""
    return BASE_URL


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args: dict):
    # Cho phép page.goto("/dashboard") thay vì phải gõ full URL mỗi lần.
    return {**browser_context_args, "base_url": BASE_URL}


@pytest.fixture(scope="session", autouse=True)
def next_server():
    """
    Chạy `next start` (production build) trỏ vào DB test cho cả session test.

    Set E2E_SKIP_SERVER_START=1 nếu bạn đã tự chạy server ở nơi khác (VD: đang dev lặp lại
    test cục bộ và không muốn start/stop server mỗi lần chạy pytest).
    """
    if os.environ.get("E2E_SKIP_SERVER_START") == "1":
        _wait_for_server(BASE_URL, SERVER_STARTUP_TIMEOUT_S)
        yield
        return

    # Gọi thẳng `node .../next/dist/bin/next start` thay vì `npm run start`: trên Windows,
    # npm spawn qua cmd.exe nên process.terminate() chỉ giết được cmd.exe, để lại tiến trình
    # `next start` mồ côi vẫn giữ cổng 3000 — lần sau chạy lại sẽ bị EADDRINUSE.
    next_bin = ROOT_DIR / "node_modules" / "next" / "dist" / "bin" / "next"
    # Không pipe stdout/stderr: để log của Next.js (kể cả crash/stack trace) in thẳng ra
    # terminal đang chạy pytest — nếu pipe lại mà không đọc, log bị "nuốt" mất, không debug được
    # khi server crash/treo giữa chừng.
    process = subprocess.Popen(
        ["node", str(next_bin), "start"],
        cwd=ROOT_DIR,
        env=os.environ.copy(),
    )
    try:
        _wait_for_server(BASE_URL, SERVER_STARTUP_TIMEOUT_S)
        yield
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)


@pytest.fixture(scope="session")
def db_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL chưa được set — kiểm tra e2e/.env.test")
    return url


@pytest.fixture
def db_conn(db_url: str):
    """Kết nối thẳng vào DB test — dùng để seed/assert dữ liệu mà không qua UI (VD: đọc verification token)."""
    conn = psycopg.connect(db_url, autocommit=True)
    try:
        yield conn
    finally:
        conn.close()


@pytest.fixture
def mock_cloudinary_upload(page):
    """
    Chặn mọi request upload ảnh lên Cloudinary trong lúc test đăng tin xe và trả về response giả,
    tránh phụ thuộc Cloudinary thật trong E2E (theo quyết định setup: mock thay vì gọi API thật).
    """

    def _fulfill(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=(
                '{"secure_url": "https://res.cloudinary.com/test/image/upload/v1/fake.jpg",'
                ' "public_id": "test/fake"}'
            ),
        )

    page.route("https://api.cloudinary.com/**", _fulfill)
    yield

PASSWORD = "Test@12345"


def unique_email() -> str:
    return f"e2e-{uuid.uuid4().hex[:12]}@example.com"


def register_and_login(page: Page, base_url: str, role: str, name: str, email: str | None = None) -> Page:
    """Đăng ký 1 user theo role chỉ định qua API, đăng nhập qua UI, trả về page đã có session."""
    email = email or unique_email()
    response = page.request.post(
        f"{base_url}/api/auth/register",
        data={
            "email": email,
            "password": PASSWORD,
            "confirmPassword": PASSWORD,
            "name": name,
            "role": role,
        },
    )
    assert response.ok, f"Register API thất bại: {response.status} {response.text()}"

    page.goto("/login")
    page.get_by_label("Email", exact=False).fill(email)
    page.get_by_label("Mật Khẩu", exact=True).fill(PASSWORD)
    page.get_by_role("button", name="Đăng Nhập", exact=True).click()
    expect(page).to_have_url(re.compile(r"/dashboard$"))
    return page


@pytest.fixture
def seller_page(page: Page, base_url: str):
    return register_and_login(page, base_url, role="individual_seller", name="E2E Seller")


@pytest.fixture
def buyer_page(page: Page, base_url: str):
    return register_and_login(page, base_url, role="buyer", name="E2E Buyer")

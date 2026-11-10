"""
Luồng P0 #1: Đăng ký -> đăng nhập (xem e2e/conftest.py cho lý do email auto-verify trong env test).
"""

import re
import uuid

import pytest
from playwright.sync_api import Page, expect

PASSWORD = "Test@12345"


def unique_email() -> str:
    return f"e2e-{uuid.uuid4().hex[:12]}@example.com"


@pytest.fixture
def registered_user(page: Page, base_url: str):
    """Tạo sẵn 1 user qua thẳng API (không qua UI) — dùng làm precondition cho test không tự test luồng đăng ký."""
    email = unique_email()
    name = "E2E Precondition User"
    response = page.request.post(
        f"{base_url}/api/auth/register",
        data={
            "email": email,
            "password": PASSWORD,
            "confirmPassword": PASSWORD,
            "name": name,
            "role": "buyer",
        },
    )
    assert response.ok, f"Register API thất bại: {response.status} {response.text()}"
    return {"email": email, "password": PASSWORD, "name": name}


def test_register_new_user_then_login(page: Page):
    email = unique_email()
    name = "Nguyen Van E2E"

    page.goto("/register")
    page.get_by_label("Họ và tên", exact=False).fill(name)
    page.get_by_label("Email", exact=False).fill(email)
    # Input password và confirmPassword chung chữ "Mật Khẩu" trong label -> lọc theo id cho chắc chắn.
    page.locator("#password").fill(PASSWORD)
    page.locator("#confirmPassword").fill(PASSWORD)
    # Vai trò mặc định đã chọn sẵn "Người mua/thuê xe" -> không cần thao tác thêm.

    page.get_by_role("button", name="Đăng Ký", exact=True).click()

    expect(page.get_by_text("Đăng Ký Thành Công!")).to_be_visible()

    page.get_by_role("button", name="Về Trang Đăng Nhập").click()
    expect(page).to_have_url(re.compile(r"/login$"))

    page.get_by_label("Email", exact=False).fill(email)
    page.get_by_label("Mật Khẩu", exact=True).fill(PASSWORD)
    page.get_by_role("button", name="Đăng Nhập", exact=True).click()

    expect(page).to_have_url(re.compile(r"/dashboard$"), timeout=10_000)
    expect(page.get_by_role("heading", level=1)).to_contain_text(name)


def test_register_duplicate_email_shows_error(page: Page, registered_user: dict):
    page.goto("/register")
    page.get_by_label("Họ và tên", exact=False).fill("Người Dùng Khác")
    page.get_by_label("Email", exact=False).fill(registered_user["email"])
    page.locator("#password").fill(PASSWORD)
    page.locator("#confirmPassword").fill(PASSWORD)

    page.get_by_role("button", name="Đăng Ký", exact=True).click()

    expect(page.get_by_text("đã được sử dụng")).to_be_visible()
    # Không được điều hướng sang trạng thái thành công.
    expect(page.get_by_text("Đăng Ký Thành Công!")).not_to_be_visible()


def test_login_wrong_password_shows_error(page: Page, registered_user: dict):
    page.goto("/login")
    page.get_by_label("Email", exact=False).fill(registered_user["email"])
    page.get_by_label("Mật Khẩu", exact=True).fill("mat-khau-sai-123")
    page.get_by_role("button", name="Đăng Nhập", exact=True).click()

    expect(page.get_by_text("Email hoặc mật khẩu không đúng")).to_be_visible()
    expect(page).to_have_url(re.compile(r"/login"))


def test_login_unknown_email_shows_error(page: Page):
    page.goto("/login")
    page.get_by_label("Email", exact=False).fill(unique_email())
    page.get_by_label("Mật Khẩu", exact=True).fill(PASSWORD)
    page.get_by_role("button", name="Đăng Nhập", exact=True).click()

    expect(page.get_by_text("Email hoặc mật khẩu không đúng")).to_be_visible()

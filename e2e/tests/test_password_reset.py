"""
Luồng P1 #6: Quên mật khẩu -> đặt lại mật khẩu -> đăng nhập bằng mật khẩu mới.
Email không gửi được trong môi trường test -> lấy token thẳng từ DB (xem db_conn trong conftest.py).
"""

import re

from conftest import PASSWORD, unique_email
from playwright.sync_api import Page, expect

NEW_PASSWORD = "NewPass@6789"


def test_forgot_password_then_reset_and_login(page: Page, base_url: str, db_conn):
    email = unique_email()
    response = page.request.post(
        f"{base_url}/api/auth/register",
        data={
            "email": email, "password": PASSWORD, "confirmPassword": PASSWORD,
            "name": "E2E Forgot", "role": "buyer",
        },
    )
    assert response.ok, f"Register API thất bại: {response.status} {response.text()}"

    page.goto("/forgot-password")
    page.get_by_label("Email", exact=False).fill(email)
    page.get_by_role("button", name="Gửi Link Đặt Lại").click()
    expect(page.get_by_text("Kiểm tra email của bạn")).to_be_visible()

    with db_conn.cursor() as cur:
        cur.execute(
            'SELECT token FROM "PasswordResetToken" WHERE "userId" = '
            '(SELECT id FROM "User" WHERE email = %s) ORDER BY "createdAt" DESC LIMIT 1',
            (email,),
        )
        token = cur.fetchone()[0]

    page.goto(f"/reset-password?token={token}")
    page.get_by_label("Mật khẩu mới", exact=True).fill(NEW_PASSWORD)
    page.get_by_label("Xác nhận mật khẩu", exact=True).fill(NEW_PASSWORD)
    page.get_by_role("button", name="Đặt Lại Mật Khẩu", exact=True).click()
    expect(page).to_have_url(re.compile(r"/login"))

    page.get_by_label("Email", exact=False).fill(email)
    page.get_by_label("Mật Khẩu", exact=True).fill(NEW_PASSWORD)
    page.get_by_role("button", name="Đăng Nhập", exact=True).click()
    expect(page).to_have_url(re.compile(r"/dashboard$"))

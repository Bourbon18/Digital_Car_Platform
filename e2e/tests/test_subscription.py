"""
Luồng P0 #5: Nâng cấp gói Pro/Business. 2 vai: seller yêu cầu + gửi chứng từ, admin duyệt.
"""

import re

from conftest import PASSWORD, register_and_login, unique_email
from playwright.sync_api import Page, expect


def test_seller_requests_pro_then_admin_activates(browser, base_url: str, db_conn):
    # --- Vai 1: seller --- đăng ký + đăng nhập, chọn gói Pro, gửi chứng từ chuyển khoản giả.
    seller_email = unique_email()
    seller_page = register_and_login(
        browser.new_context(base_url=base_url).new_page(),
        base_url, role="individual_seller", name="E2E Upgrader", email=seller_email,
    )
    seller_page.goto("/dashboard/subscription")

    pro_card = seller_page.locator(".rounded-xl", has_text="Pro")
    pro_card.get_by_role("button", name="Chọn gói này").click()
    pro_card.get_by_role("button", name="Tiếp tục thanh toán").click()

    seller_page.locator('input[type="file"]').set_input_files(
        files=[{"name": "proof.png", "mimeType": "image/png", "buffer": b"fake-proof-bytes"}]
    )
    seller_page.get_by_role("button", name="Gửi chứng từ").click()
    expect(seller_page.get_by_text("Đã nhận chứng từ")).to_be_visible()

    # --- Vai 2: admin ---
    # Đăng ký bình thường (role tạm "buyer") nhưng CHƯA đăng nhập -> promote role trước bằng SQL
    # -> đăng nhập lần đầu sau đó, để JWT được tạo ra đã mang đúng role "admin" ngay từ đầu.
    admin_context = browser.new_context(base_url=base_url)
    admin_page = admin_context.new_page()
    admin_email = unique_email()
    response = admin_page.request.post(
        f"{base_url}/api/auth/register",
        data={
            "email": admin_email, "password": PASSWORD, "confirmPassword": PASSWORD,
            "name": "E2E Admin", "role": "buyer",
        },
    )
    assert response.ok, f"Register API thất bại: {response.status} {response.text()}"

    with db_conn.cursor() as cur:
        cur.execute("UPDATE \"User\" SET role = 'admin' WHERE email = %s", (admin_email,))

    admin_page.goto("/login")
    admin_page.get_by_label("Email", exact=False).fill(admin_email)
    admin_page.get_by_label("Mật Khẩu", exact=True).fill(PASSWORD)
    admin_page.get_by_role("button", name="Đăng Nhập", exact=True).click()
    expect(admin_page).to_have_url(re.compile(r"/dashboard$"))

    admin_page.goto("/admin/subscriptions")
    request_row = admin_page.locator(".rounded-lg.border", has_text=seller_email)
    request_row.get_by_role("button", name="Kích hoạt").click()
    # Bắt buộc đợi tín hiệu quan sát được xác nhận server đã xử lý xong (handleActivate là async,
    # .click() chỉ đợi bấm được, không đợi việc xảy ra SAU đó) — dòng chờ duyệt phải biến mất
    # khỏi danh sách sau khi router.refresh() render lại với dữ liệu mới.
    expect(request_row).to_be_hidden(timeout=10_000)

    # Seller load lại trang gói dịch vụ -> thấy Pro đã kích hoạt thật.
    seller_page.goto("/dashboard/subscription")
    expect(seller_page.get_by_text("Đang sử dụng")).to_be_visible(timeout=10_000)

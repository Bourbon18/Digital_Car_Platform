"""
Luồng P1 #9: Admin duyệt tin đăng. Tin seller đăng mới -> "Chờ duyệt" -> admin duyệt -> "Đang hiển thị".
"""

import re
import uuid

from conftest import PASSWORD, register_and_login, unique_email
from playwright.sync_api import Page, expect


def test_admin_approves_pending_listing(browser, base_url: str, db_conn, seller_page: Page, mock_cloudinary_upload):
    listing_title = f"Toyota Camry test admin {uuid.uuid4().hex[:6]}"

    seller_page.goto("/dang-tin")
    selects = seller_page.locator("select")
    selects.nth(0).select_option(label="Toyota")
    selects.nth(1).select_option(index=1)
    seller_page.get_by_placeholder("VD: Toyota Camry 2.5Q 2020 ít đi, bảo dưỡng đầy đủ").fill(listing_title)
    seller_page.get_by_role("button", name="Tiếp theo").click()

    seller_page.locator('input[type="file"]').set_input_files(
        files=[{"name": "car.jpg", "mimeType": "image/jpeg", "buffer": b"fake-image-bytes"}]
    )
    seller_page.get_by_role("button", name="Tiếp theo").click()

    seller_page.get_by_placeholder("500000000").fill("600000000")
    selects.last.select_option(index=1)
    seller_page.locator("textarea").fill("Xe đẹp, test admin duyệt.")
    seller_page.get_by_role("button", name="Đăng Tin").click()

    expect(seller_page).to_have_url(re.compile(r"/dashboard/listings$"), timeout=10_000)
    expect(seller_page.get_by_text(listing_title)).to_be_visible()
    expect(seller_page.get_by_text("Chờ duyệt")).to_be_visible()

    # --- Admin duyệt tin --- (đăng ký -> promote role trước -> đăng nhập, lý do xem test_subscription.py)
    admin_email = unique_email()
    admin_page = browser.new_context(base_url=base_url).new_page()
    response = admin_page.request.post(
        f"{base_url}/api/auth/register",
        data={
            "email": admin_email, "password": PASSWORD, "confirmPassword": PASSWORD,
            "name": "E2E Listing Admin", "role": "buyer",
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

    admin_page.goto("/admin/listings")  # mặc định lọc status=pending
    row = admin_page.locator(".rounded-lg.border", has_text=listing_title)
    row.click()  # mở rộng dòng — nút Duyệt/Từ chối chỉ hiện khi đang mở
    row.get_by_role("button", name="Duyệt", exact=True).click()
    # Đợi tín hiệu quan sát được: tin đã duyệt sẽ không còn khớp bộ lọc status=pending nữa -> biến mất.
    expect(row).to_be_hidden(timeout=10_000)

    # Seller load lại -> thấy tin đã chuyển "Đang hiển thị".
    seller_page.goto("/dashboard/listings")
    expect(seller_page.get_by_text("Đang hiển thị")).to_be_visible(timeout=10_000)

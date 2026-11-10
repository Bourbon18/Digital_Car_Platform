
"""
Luồng P0 #2: Đăng tin xe (chỉ seller/renter/dealer mới đăng được, buyer thì không).
"""


import re
from urllib import response
import uuid
import pytest
from playwright.sync_api import Page, expect



def test_create_listing_happy_path(seller_page: Page, mock_cloudinary_upload):
    page = seller_page
    listing_title = f"Toyota Camry test {uuid.uuid4().hex[:6]}"
    page.goto("/dang-tin")

    # Step 1 - Thông tin xe
    selects = page.locator("select")
    selects.nth(0).select_option(label="Toyota")      # Hãng xe
    selects.nth(1).select_option(index=1)              # Model - option đầu tiên sau "Chọn model"
    page.get_by_placeholder("VD: Toyota Camry 2.5Q 2020 ít đi, bảo dưỡng đầy đủ").fill(listing_title)
    page.get_by_role("button", name="Tiếp theo").click()

    # Step 2 - Ảnh (mock_cloudinary_upload đã chặn request upload thật, không cần file ảnh có thật)
    page.locator('input[type="file"]').set_input_files(
        files=[{"name": "car.jpg", "mimeType": "image/jpeg", "buffer": b"fake-image-bytes"}]
    )
    page.get_by_role("button", name="Tiếp theo").click()

    # Step 3 - Giá & chi tiết
    page.get_by_placeholder("500000000").fill("600000000")
    selects.last.select_option(index=1)                 # Tỉnh/Thành phố
    page.locator("textarea").fill("Xe đẹp, test E2E, không tai nạn.")
    page.get_by_role("button", name="Đăng Tin").click()

    expect(page).to_have_url(re.compile(r"/dashboard/listings$"), timeout=10_000)
    expect(page.get_by_text(listing_title)).to_be_visible()
    expect(page.get_by_text("Chờ duyệt")).to_be_visible()

def test_buyer_cannot_access_create_listing(buyer_page: Page):
    page = buyer_page
    page.goto("/dang-tin")

    expect(page.get_by_text("Bạn không có quyền đăng tin")).to_be_visible()
    # Khẳng định mạnh hơn: không chỉ thấy thông báo, mà form THỰC SỰ không được render ra.
    expect(page.locator("select")).to_have_count(0)


def test_create_listing_requires_at_least_one_image(seller_page: Page):
    page = seller_page
    page.goto("/dang-tin")

    page.locator("select").nth(0).select_option(label="Toyota")
    page.locator("select").nth(1).select_option(index=1)
    page.get_by_placeholder("VD: Toyota Camry 2.5Q 2020 ít đi, bảo dưỡng đầy đủ").fill("Xe test không ảnh")
    page.get_by_role("button", name="Tiếp theo").click()

    expect(page.get_by_text("Vui lòng upload ít nhất 1 ảnh xe")).to_be_visible()
    expect(page.get_by_role("button", name="Tiếp theo")).to_be_disabled()
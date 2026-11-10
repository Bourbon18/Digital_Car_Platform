"""
Luồng P0 #3: Tìm kiếm & xem chi tiết xe. Dùng dữ liệu đã seed sẵn (status active),
vì API search chỉ trả tin active - tin tự tạo trong lúc test đang ở trạng thái "Chờ duyệt".
"""

import re

from playwright.sync_api import Page, expect

SEEDED_TITLE = "Toyota Camry 2.5Q 2022 - Xe đẹp như mới"


def test_search_finds_listing_and_opens_detail(page: Page):
    page.goto("/")
    page.get_by_placeholder("Tìm xe theo hãng, model...").fill(SEEDED_TITLE)
    page.keyboard.press("Enter")

    expect(page).to_have_url(re.compile(r"/mua-xe\?q="))
    result = page.get_by_text(SEEDED_TITLE, exact=False).first
    expect(result).to_be_visible()

    result.click()

    expect(page).to_have_url(re.compile(r"/xe/"))
    expect(page.get_by_role("heading", level=1)).to_contain_text(SEEDED_TITLE)


def test_search_no_match_shows_empty_state(page: Page):
    page.goto("/mua-xe?q=xkcd-khong-ton-tai-123456")

    expect(page.get_by_text("Không tìm thấy xe phù hợp")).to_be_visible()

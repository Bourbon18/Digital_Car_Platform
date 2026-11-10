"""
Smoke test cho chính hạ tầng E2E (Docker DB + next start + Playwright + pytest nối được với nhau).
Các luồng nghiệp vụ thật (đăng ký, đăng tin, booking...) sẽ nằm ở các file test_*.py khác.
"""

import re

from playwright.sync_api import Page, expect


def test_homepage_loads(page: Page):
    page.goto("/")
    expect(page).to_have_title(re.compile(r".+"))


def test_login_page_has_form(page: Page):
    page.goto("/login")
    expect(page.get_by_label("Email", exact=False)).to_be_visible()

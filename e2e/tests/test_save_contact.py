"""
Luồng P1 #8: Lưu tin xe & liên hệ người bán.
"""

from conftest import register_and_login, unique_email
from playwright.sync_api import Page, expect

SEEDED_LISTING_TITLE = "Toyota Camry 2.5Q 2022 - Xe đẹp như mới"
CONTACT_MESSAGE = "Xe này còn không ạ? Tôi muốn xem trực tiếp."


def test_save_listing_and_contact_seller(page: Page, base_url: str, db_conn):
    buyer_email = unique_email()
    buyer_page = register_and_login(page, base_url, role="buyer", name="E2E Contact Buyer", email=buyer_email)

    buyer_page.goto("/mua-xe")
    buyer_page.get_by_text(SEEDED_LISTING_TITLE, exact=False).first.click()
    expect(buyer_page.get_by_role("heading", level=1)).to_contain_text(SEEDED_LISTING_TITLE)

    # Lưu tin
    buyer_page.get_by_role("button", name="Lưu xe").click()

    # Liên hệ người bán — cùng trang chi tiết, không cần rời đi.
    buyer_page.get_by_label("Tin nhắn của bạn").fill(CONTACT_MESSAGE)
    buyer_page.get_by_role("button", name="Gửi Liên Hệ", exact=True).click()

    # Xác nhận lưu tin thành công qua trang "Xe đã lưu".
    buyer_page.goto("/dashboard/saved")
    expect(buyer_page.get_by_text(SEEDED_LISTING_TITLE, exact=False)).to_be_visible()

    # Xác nhận liên hệ thành công — tra thẳng DB, vì /dashboard/messages là UI chat phức tạp
    # (ChatShell), không phải trọng tâm của test này.
    with db_conn.cursor() as cur:
        cur.execute(
            'SELECT content FROM "ContactMessage" WHERE "senderId" = '
            '(SELECT id FROM "User" WHERE email = %s) ORDER BY "createdAt" DESC LIMIT 1',
            (buyer_email,),
        )
        row = cur.fetchone()
    assert row is not None, "Không tìm thấy ContactMessage vừa gửi trong DB"
    assert row[0] == CONTACT_MESSAGE

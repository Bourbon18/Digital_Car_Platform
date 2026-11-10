"""
Luồng P0 #4 (phần 1): Buyer đặt thuê xe thành công (tới trạng thái "pending").
Phần chủ xe xác nhận + buyer thanh toán QR cần 2 vai, để riêng ở bài sau.
"""

import random
import re
import uuid
from datetime import date, timedelta
from conftest import register_and_login, unique_email


from playwright.sync_api import Page, expect

SEEDED_RENTAL_TITLE = "Toyota Camry 2023 cho thuê tự lái TP.HCM"


def test_buyer_books_rental_listing(buyer_page: Page):
    page = buyer_page
    page.goto("/thue-xe")
    page.get_by_text(SEEDED_RENTAL_TITLE, exact=False).first.click()

    start = date.today() + timedelta(days=3)
    end = start + timedelta(days=5)
    page.get_by_label("Ngày nhận xe").fill(start.isoformat())
    page.get_by_label("Ngày trả xe").fill(end.isoformat())

    page.get_by_role("button", name="Đặt Ngay").click()

    expect(page).to_have_url(re.compile(r"/dashboard/bookings$"), timeout=10_000)
    expect(page.get_by_text(SEEDED_RENTAL_TITLE, exact=False)).to_be_visible()
    expect(page.get_by_text("Chờ xác nhận")).to_be_visible()

SEEDED_RENTAL_FOR_OWNER_FLOW = "Honda CR-V 2022 cho thuê ngày/tuần/tháng HN"
def test_owner_confirms_booking_then_buyer_pays(browser, base_url: str, db_conn):
    # --- Vai 1: chủ xe --- tạo context riêng, không dùng chung `page` với buyer.
    owner_email = unique_email()
    owner_context = browser.new_context(base_url=base_url)
    owner_page = register_and_login(
        owner_context.new_page(), base_url, role="individual_seller", name="E2E Owner", email=owner_email
    )

    # Tiền đề qua DB thẳng — gán QR + đổi chủ tin đã seed, không phải thứ đang test ở đây.
    with db_conn.cursor() as cur:
        cur.execute('SELECT id FROM "User" WHERE email = %s', (owner_email,))
        owner_id = cur.fetchone()[0]
        cur.execute('UPDATE "User" SET "paymentQrUrl" = %s WHERE id = %s',
                    ("https://via.placeholder.com/200x200.png?text=QR", owner_id))
        # LIMIT 1 qua subquery: title này đã bị trùng nhiều dòng do chạy `db:seed` lại nhiều lần
        # trong ngày (mỗi lần slug ngẫu nhiên khác nhau) -> không giới hạn sẽ gán CẢ các dòng trùng
        # cho owner này, kéo theo lịch sử booking cũ của dòng kia hiện chung trên /dashboard/rentals.
        cur.execute(
            'UPDATE "Listing" SET "userId" = %s '
            'WHERE id = (SELECT id FROM "Listing" WHERE title = %s LIMIT 1) RETURNING id, slug',
            (owner_id, SEEDED_RENTAL_FOR_OWNER_FLOW),
        )
        listing_id, listing_slug = cur.fetchone()

        # Dọn sạch lịch sử booking cũ của đúng tin này — DB test đã bị chạy tay rất nhiều lần
        # trong ngày, booking cũ còn sót lại (confirmed/paid ở nhiều khoảng ngày khác nhau) có thể
        # đụng lịch với khoảng ngày random mới sinh ra bên dưới. Payment phải xoá trước Booking vì
        # có khoá ngoại tới Booking.
        cur.execute(
            'DELETE FROM "Payment" WHERE "bookingId" IN '
            '(SELECT id FROM "Booking" WHERE "listingId" = %s)',
            (listing_id,),
        )
        cur.execute('DELETE FROM "Booking" WHERE "listingId" = %s', (listing_id,))

    # --- Vai 2: buyer --- context riêng thứ hai, hoạt động song song với owner_page.
    # Tên cũng phải duy nhất (không chỉ email): trang /dashboard/rentals hiển thị TÊN buyer, và
    # mình sẽ dùng chính tên này để khoanh đúng dòng cần bấm giữa nhiều booking cũ còn sót lại.
    buyer_name = f"E2E Payer {uuid.uuid4().hex[:6]}"
    buyer_context = browser.new_context(base_url=base_url)
    buyer_page = register_and_login(buyer_context.new_page(), base_url, role="buyer", name=buyer_name)

    buyer_page.goto(f"/xe/{listing_slug}")
    # Random hoá offset ngày: nếu chạy lại trong cùng ngày thực tế, khoảng ngày cố định (+3 -> +8)
    # sẽ đụng lịch với booking "confirmed" của lần chạy trước trên cùng tin xe -> createBooking từ chối.
    offset = random.randint(1, 300)
    start = date.today() + timedelta(days=offset)
    end = start + timedelta(days=5)
    buyer_page.get_by_label("Ngày nhận xe").fill(start.isoformat())
    buyer_page.get_by_label("Ngày trả xe").fill(end.isoformat())
    buyer_page.get_by_role("button", name="Đặt Ngay").click()
    expect(buyer_page).to_have_url(re.compile(r"/dashboard/bookings$"), timeout=10_000)

    # Lấy booking vừa tạo từ DB — không có cách nào khác để chủ xe biết đúng booking nào cần xác nhận.
    with db_conn.cursor() as cur:
        cur.execute(
            'SELECT id FROM "Booking" WHERE "listingId" = '
            '(SELECT id FROM "Listing" WHERE slug = %s) ORDER BY "createdAt" DESC LIMIT 1',
            (listing_slug,),
        )
        booking_id = cur.fetchone()[0]

    # Chủ xe xác nhận booking — khoanh vùng đúng dòng theo tên buyer (duy nhất), không dùng .first
    # vì trang liệt kê TẤT CẢ booking từng có trên tin này, kể cả từ các lần chạy test trước.
    owner_page.goto("/dashboard/rentals")
    booking_row = owner_page.locator(".rounded-lg.border", has_text=buyer_name)
    booking_row.get_by_role("button", name="Xác nhận", exact=True).click()
    expect(booking_row.get_by_text("Đã xác nhận", exact=True)).to_be_visible()

    # Buyer thấy nút Thanh toán xuất hiện (chỉ hiện khi status = confirmed), bấm vào, xác nhận chuyển khoản.
    buyer_page.goto("/dashboard/bookings")
    buyer_page.get_by_role("button", name="Thanh toán").click()
    expect(buyer_page).to_have_url(re.compile(rf"/payment/{booking_id}$"))
    buyer_page.get_by_role("button", name="Xác nhận đã chuyển khoản").click()

    expect(buyer_page).to_have_url(re.compile(r"/payment/success$"), timeout=10_000)

    owner_context.close()
    buyer_context.close()
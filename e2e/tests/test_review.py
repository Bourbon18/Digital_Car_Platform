"""
Luồng P1 #10: Đánh giá sau khi hoàn thành chuyến thuê.
Booking phải đi hết vòng đời: pending -> confirmed -> paid -> active -> completed.
"""

import random
import re
import uuid
from datetime import date, timedelta

from conftest import PASSWORD, register_and_login, unique_email
from playwright.sync_api import Page, expect

SEEDED_RENTAL_FOR_REVIEW_FLOW = "VinFast VF8 2023 thuê xe điện trải nghiệm"


def test_review_after_completed_rental(browser, base_url: str, db_conn):
    # --- Vai 1: chủ xe --- (giống hệt test_booking.py — xem comment ở đó để biết lý do từng dòng)
    owner_email = unique_email()
    owner_context = browser.new_context(base_url=base_url)
    owner_page = register_and_login(
        owner_context.new_page(), base_url, role="individual_seller", name="E2E Review Owner", email=owner_email
    )

    with db_conn.cursor() as cur:
        cur.execute('SELECT id FROM "User" WHERE email = %s', (owner_email,))
        owner_id = cur.fetchone()[0]
        cur.execute('UPDATE "User" SET "paymentQrUrl" = %s WHERE id = %s',
                    ("https://via.placeholder.com/200x200.png?text=QR", owner_id))
        cur.execute(
            'UPDATE "Listing" SET "userId" = %s '
            'WHERE id = (SELECT id FROM "Listing" WHERE title = %s LIMIT 1) RETURNING id, slug',
            (owner_id, SEEDED_RENTAL_FOR_REVIEW_FLOW),
        )
        listing_id, listing_slug = cur.fetchone()
        # Review cũng tham chiếu tới Booking (khoá ngoại) — phải xoá trước Booking.
        # Lần chạy test THÀNH CÔNG trước đó đã tạo ra 1 review thật trên chính booking cũ,
        # nên từ lần chạy thứ 2 trở đi, xoá Booking mà bỏ sót Review sẽ vi phạm khoá ngoại.
        cur.execute(
            'DELETE FROM "Review" WHERE "bookingId" IN '
            '(SELECT id FROM "Booking" WHERE "listingId" = %s)',
            (listing_id,),
        )
        cur.execute(
            'DELETE FROM "Payment" WHERE "bookingId" IN '
            '(SELECT id FROM "Booking" WHERE "listingId" = %s)',
            (listing_id,),
        )
        cur.execute('DELETE FROM "Booking" WHERE "listingId" = %s', (listing_id,))

    buyer_name = f"E2E Reviewer {uuid.uuid4().hex[:6]}"
    buyer_context = browser.new_context(base_url=base_url)
    buyer_page = register_and_login(buyer_context.new_page(), base_url, role="buyer", name=buyer_name)

    buyer_page.goto(f"/xe/{listing_slug}")
    offset = random.randint(1, 300)
    start = date.today() + timedelta(days=offset)
    end = start + timedelta(days=5)
    buyer_page.get_by_label("Ngày nhận xe").fill(start.isoformat())
    buyer_page.get_by_label("Ngày trả xe").fill(end.isoformat())
    buyer_page.get_by_role("button", name="Đặt Ngay").click()
    expect(buyer_page).to_have_url(re.compile(r"/dashboard/bookings$"), timeout=10_000)

    with db_conn.cursor() as cur:
        cur.execute(
            'SELECT id FROM "Booking" WHERE "listingId" = %s ORDER BY "createdAt" DESC LIMIT 1',
            (listing_id,),
        )
        booking_id = cur.fetchone()[0]

    # Chủ xe xác nhận.
    owner_page.goto("/dashboard/rentals")
    booking_row = owner_page.locator(".rounded-lg.border", has_text=buyer_name)
    booking_row.get_by_role("button", name="Xác nhận", exact=True).click()
    expect(booking_row.get_by_text("Đã xác nhận", exact=True)).to_be_visible()

    # Buyer thanh toán.
    buyer_page.goto("/dashboard/bookings")
    buyer_page.get_by_role("button", name="Thanh toán").click()
    expect(buyer_page).to_have_url(re.compile(rf"/payment/{booking_id}$"))
    buyer_page.get_by_role("button", name="Xác nhận đã chuyển khoản").click()
    expect(buyer_page).to_have_url(re.compile(r"/payment/success$"), timeout=10_000)

    # --- Phần mới: chủ xe bàn giao xe, rồi đánh dấu chuyến đã hoàn thành ---
    owner_page.goto("/dashboard/rentals")
    booking_row = owner_page.locator(".rounded-lg.border", has_text=buyer_name)
    booking_row.get_by_role("button", name="Bàn giao xe", exact=True).click()
    # Nút "Bàn giao xe" chỉ hiện khi status=paid, nút "Hoàn thành" chỉ hiện khi status=active —
    # 2 nút khác nhau ở 2 vị trí thời gian khác nhau, không phải cùng 1 nút đổi tên như case trước.
    expect(booking_row.get_by_role("button", name="Hoàn thành", exact=True)).to_be_visible(timeout=10_000)
    booking_row.get_by_role("button", name="Hoàn thành", exact=True).click()
    # Hoàn thành xong, cả khối nút hành động biến mất hẳn (xem điều kiện render ở dashboard/rentals/page.tsx)
    # -> đợi badge trạng thái cập nhật là đủ, không lo trùng chữ "Hoàn thành" với nút nữa.
    expect(booking_row.get_by_text("Hoàn thành", exact=True)).to_be_visible(timeout=10_000)

    # --- Buyer viết đánh giá ---
    buyer_page.goto(f"/xe/{listing_slug}")
    buyer_page.get_by_placeholder("Chia sẻ trải nghiệm thuê xe của bạn... (10-500 ký tự)").fill(
        "Xe rất tốt, chủ xe thân thiện, sẽ thuê lại lần sau!"
    )
    buyer_page.get_by_role("button", name="Gửi Đánh Giá", exact=True).click()

    expect(buyer_page.get_by_text("Xe rất tốt, chủ xe thân thiện")).to_be_visible(timeout=10_000)

// Map một thông báo sang đường dẫn để khi bấm vào sẽ tới đúng nơi xử lý.
// Ưu tiên metadata.url nếu được set sẵn lúc tạo thông báo (vd: payment_success
// gửi cho cả 2 phía nên cần link riêng cho từng người).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function notificationLink(type: string, metadata?: any): string {
  if (metadata && typeof metadata.url === "string") return metadata.url;

  switch (type) {
    // Chủ xe — trang Quản Lý Cho Thuê (xác nhận / bàn giao / hoàn thành)
    case "booking_new":
    case "booking_cancelled":
    case "booking_reminder":
    case "review_new":
      return "/dashboard/rentals";

    // Khách thuê — trang Lịch Sử Thuê Xe (thanh toán / đánh giá)
    case "booking_confirmed":
    case "booking_rejected":
    case "booking_completed":
    case "payment_refund":
      return "/dashboard/bookings";

    case "new_message":
      return "/dashboard/messages";

    case "listing_pending_review":
      return "/admin/listings";

    case "subscription_pending":
      return "/admin/subscriptions";

    case "subscription_activated":
    case "subscription_rejected":
      return "/dashboard/subscription";

    case "listing_approved":
    case "listing_rejected":
      return "/dashboard/listings";

    default:
      return "/dashboard/notifications";
  }
}

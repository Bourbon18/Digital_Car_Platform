## ADDED Requirements

### Requirement: VNPay Payment Integration
Hệ thống SHALL tích hợp VNPay làm cổng thanh toán chính cho giao dịch thuê xe. Khi buyer thanh toán deposit, hệ thống SHALL redirect sang trang thanh toán VNPay. Sau khi thanh toán, VNPay SHALL redirect về callback URL của hệ thống. Hệ thống SHALL xác thực chữ ký (HMAC-SHA512) từ VNPay trước khi cập nhật trạng thái booking.

#### Scenario: Thanh toán deposit thành công qua VNPay
- **WHEN** buyer nhấn "Thanh toán đặt cọc" trên booking đã `confirmed`, hoàn thành thanh toán trên VNPay
- **THEN** VNPay redirect về `/payment/callback?vnp_ResponseCode=00`, hệ thống xác thực chữ ký, cập nhật booking thành `paid`, và gửi notification cho cả buyer và chủ xe

#### Scenario: Thanh toán thất bại hoặc bị hủy
- **WHEN** buyer hủy thanh toán hoặc thẻ bị từ chối trên VNPay
- **THEN** VNPay redirect về callback với `vnp_ResponseCode != 00`, hệ thống KHÔNG cập nhật booking, hiển thị trang "Thanh toán không thành công" với nút "Thử lại"

#### Scenario: Chữ ký VNPay không hợp lệ
- **WHEN** callback nhận được từ VNPay có chữ ký HMAC-SHA512 không khớp
- **THEN** hệ thống từ chối xử lý, log cảnh báo bảo mật, và KHÔNG cập nhật trạng thái booking

---

### Requirement: Payment Record Keeping
Hệ thống SHALL lưu mọi transaction vào bảng `payments` với đầy đủ thông tin: booking ID, amount, currency (VND), payment method, VNPay transaction ID (`vnp_TransactionNo`), response code, và timestamp. Mỗi booking SHALL chỉ có một payment record thành công.

#### Scenario: Lưu payment record sau giao dịch thành công
- **WHEN** payment callback xác nhận thành công
- **THEN** hệ thống tạo record trong bảng `payments` với status = `success` và toàn bộ thông tin từ VNPay response

#### Scenario: Idempotency — tránh thanh toán trùng lặp
- **WHEN** VNPay gửi callback nhiều lần cho cùng một giao dịch (retry)
- **THEN** hệ thống kiểm tra `vnp_TransactionNo` đã tồn tại, bỏ qua request trùng lặp và không tạo payment record mới

---

### Requirement: Refund Processing
Hệ thống SHALL hỗ trợ hoàn tiền khi buyer hủy booking `paid`. Chính sách hoàn tiền: hủy trước 48 giờ = hoàn 100% deposit; hủy 24-48 giờ = hoàn 70%; hủy < 24 giờ = không hoàn. Hoàn tiền VNPay SHALL được xử lý qua VNPay Refund API và phản ánh trong vòng 3-5 ngày làm việc.

#### Scenario: Hoàn tiền đủ điều kiện (hủy > 48 giờ trước)
- **WHEN** buyer hủy booking `paid` với thời điểm nhận xe còn > 48 giờ
- **THEN** hệ thống tính hoàn 100%, gọi VNPay Refund API, tạo refund record, và gửi email xác nhận hoàn tiền

#### Scenario: Hoàn tiền một phần (hủy trong 24-48 giờ)
- **WHEN** buyer hủy booking `paid` với thời điểm nhận xe còn 24-48 giờ
- **THEN** hệ thống tính hoàn 70%, gọi VNPay Refund API với amount tương ứng, và hiển thị thông báo rõ số tiền được hoàn

#### Scenario: Không được hoàn tiền (hủy < 24 giờ)
- **WHEN** buyer cố hủy booking `paid` với thời điểm nhận xe còn < 24 giờ
- **THEN** hệ thống hiển thị cảnh báo rõ "Hủy trong vòng 24 giờ sẽ không được hoàn cọc" và yêu cầu buyer xác nhận trước khi tiến hành

---

### Requirement: Payment Status Display
Hệ thống SHALL hiển thị trạng thái thanh toán rõ ràng trong dashboard của buyer và chủ xe. Trang booking detail SHALL hiển thị: số tiền deposit, trạng thái thanh toán, ID giao dịch VNPay (để tra cứu), và lịch sử payment.

#### Scenario: Buyer xem trạng thái payment
- **WHEN** buyer truy cập trang booking detail sau khi thanh toán thành công
- **THEN** hệ thống hiển thị: "Đã thanh toán cọc: 450.000 VND", mã giao dịch VNPay, và ngày thanh toán

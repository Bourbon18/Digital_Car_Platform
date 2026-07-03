## ADDED Requirements

### Requirement: View Rental Availability
Hệ thống SHALL hiển thị availability calendar cho mỗi listing `for-rent`, cho thấy ngày đã được đặt (blocked) và ngày còn trống. Calendar SHALL được tính từ ngày hiện tại đến 3 tháng tiếp theo. Ngày đã có booking `confirmed` hoặc `active` SHALL hiển thị là unavailable.

#### Scenario: Xem calendar xe còn trống
- **WHEN** người dùng mở trang listing xe cho thuê
- **THEN** hệ thống hiển thị calendar với các ngày available (xanh) và unavailable (đỏ/xám) dựa trên booking hiện có

#### Scenario: Xe không có ngày trống trong 3 tháng tới
- **WHEN** tất cả ngày trong 3 tháng tiếp theo đều đã được đặt
- **THEN** hệ thống hiển thị thông báo "Xe hiện không có lịch trống trong 3 tháng tới"

---

### Requirement: Create Rental Booking
Hệ thống SHALL cho phép `buyer` tạo booking thuê xe bằng cách chọn ngày bắt đầu và kết thúc từ availability calendar. Booking MUST bao gồm: listing ID, ngày thuê, ngày trả, địa điểm giao xe (do chủ xe cung cấp), và tổng tiền được tính tự động. Hệ thống SHALL kiểm tra availability và lock ngày trong cùng một database transaction để tránh double booking.

#### Scenario: Tạo booking thành công
- **WHEN** buyer chọn ngày thuê hợp lệ (còn available) và confirm booking
- **THEN** hệ thống tạo booking với trạng thái `pending`, lock ngày đã chọn trong calendar, và gửi notification cho chủ xe

#### Scenario: Double booking race condition
- **WHEN** hai người dùng đồng thời book cùng ngày cho cùng một xe
- **THEN** hệ thống chỉ cho phép một booking thành công; người còn lại nhận thông báo "Ngày này đã được đặt trước, vui lòng chọn ngày khác"

#### Scenario: Buyer cố book ngày đã qua
- **WHEN** buyer chọn ngày bắt đầu là ngày hôm nay hoặc ngày trong quá khứ
- **THEN** hệ thống hiển thị lỗi "Ngày thuê phải bắt đầu từ ngày mai trở đi"

---

### Requirement: Booking Price Calculation
Hệ thống SHALL tự động tính tổng tiền thuê dựa trên: giá/ngày của listing × số ngày thuê. Nếu thuê từ 7 ngày trở lên, hệ thống SHALL áp dụng giảm giá 10% (nếu chủ xe bật tùy chọn này). Deposit SHALL là 30% tổng tiền, phần còn lại được thanh toán khi nhận xe (hoặc toàn bộ online nếu chủ xe yêu cầu).

#### Scenario: Tính giá thuê 3 ngày
- **WHEN** buyer chọn thuê từ 01/07 đến 04/07 (3 ngày) với giá 500.000 VND/ngày
- **THEN** hệ thống hiển thị: Tổng = 1.500.000 VND, Đặt cọc = 450.000 VND

#### Scenario: Áp dụng giảm giá tuần
- **WHEN** buyer chọn thuê 7 ngày và chủ xe đã bật weekly discount
- **THEN** hệ thống tính giá sau giảm 10% và hiển thị rõ: "Tiết kiệm X VND so với giá ngày thường"

---

### Requirement: Booking Status Management
Booking SHALL có các trạng thái: `pending` (chờ chủ xe xác nhận) → `confirmed` (chủ xe đã xác nhận, chờ thanh toán) → `paid` (đã thanh toán deposit) → `active` (đang thuê) → `completed` (đã trả xe). Chủ xe SHALL có thể từ chối booking (`rejected`). Buyer SHALL có thể hủy booking trước khi `active`.

#### Scenario: Chủ xe xác nhận booking
- **WHEN** chủ xe nhấn "Xác nhận" trên booking `pending`
- **THEN** hệ thống chuyển trạng thái thành `confirmed` và gửi notification cho buyer kèm thông tin thanh toán

#### Scenario: Chủ xe từ chối booking
- **WHEN** chủ xe nhấn "Từ chối" và điền lý do
- **THEN** hệ thống chuyển trạng thái thành `rejected`, giải phóng ngày đã lock, và gửi notification cho buyer kèm lý do từ chối

#### Scenario: Buyer hủy booking đã confirmed nhưng chưa active
- **WHEN** buyer hủy booking ở trạng thái `paid` trước 24 giờ so với ngày nhận xe
- **THEN** hệ thống hoàn trả 70% deposit, giải phóng ngày đã lock, và chuyển trạng thái thành `cancelled`

#### Scenario: Đánh dấu booking hoàn thành
- **WHEN** chủ xe xác nhận đã nhận lại xe
- **THEN** hệ thống chuyển trạng thái thành `completed` và mở khóa tính năng để buyer viết review

---

### Requirement: Rental Booking History
Người dùng SHALL có thể xem lịch sử booking của mình trong dashboard: với buyer xem danh sách xe đã thuê, với chủ xe xem danh sách booking nhận được. Mỗi booking hiển thị: tên xe, ngày thuê, tổng tiền, trạng thái, và action phù hợp (Cancel / Review / Liên hệ).

#### Scenario: Buyer xem lịch sử thuê xe
- **WHEN** buyer truy cập trang `/dashboard/bookings`
- **THEN** hệ thống hiển thị danh sách booking sắp xếp theo ngày mới nhất, với trạng thái và action tương ứng

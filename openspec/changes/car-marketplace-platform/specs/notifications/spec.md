## ADDED Requirements

### Requirement: In-App Notifications
Hệ thống SHALL lưu thông báo in-app trong bảng `notifications` và hiển thị trong notification bell ở header. Bell SHALL hiển thị badge với số thông báo chưa đọc. Người dùng SHALL có thể đánh dấu đọc từng thông báo hoặc tất cả. Thông báo chưa đọc SHALL được lưu tối đa 90 ngày.

#### Scenario: Nhận thông báo in-app mới
- **WHEN** chủ xe nhận được booking mới trong khi đang trên web app
- **THEN** badge trên notification bell tăng lên 1 và notification mới xuất hiện khi mở dropdown (không cần reload page — dùng polling mỗi 30 giây)

#### Scenario: Đánh dấu tất cả đã đọc
- **WHEN** người dùng nhấn "Đánh dấu tất cả đã đọc"
- **THEN** hệ thống set `read = true` cho tất cả notification của user, badge về 0

---

### Requirement: Email Notifications — Booking Events
Hệ thống SHALL gửi email tự động cho các sự kiện booking sau đây. Email MUST được gửi trong vòng 2 phút từ khi sự kiện xảy ra. Hệ thống SHALL dùng queue (không gửi synchronous trong request) để xử lý email.

**Sự kiện kích hoạt email:**
- Booking mới được tạo → email cho chủ xe
- Chủ xe xác nhận booking → email cho buyer kèm hướng dẫn thanh toán
- Chủ xe từ chối booking → email cho buyer kèm lý do
- Buyer thanh toán thành công → email xác nhận cho cả buyer và chủ xe
- Booking bị hủy → email cho cả hai bên
- Nhắc nhở 24 giờ trước khi nhận xe → email cho buyer
- Booking hoàn thành → email cho buyer mời viết review

#### Scenario: Email xác nhận booking cho chủ xe
- **WHEN** buyer tạo booking mới
- **THEN** chủ xe nhận email trong vòng 2 phút với: tên buyer, ngày thuê, số tiền, và nút "Xác nhận" / "Từ chối" dẫn về dashboard

#### Scenario: Email nhắc nhở 24 giờ
- **WHEN** đến 24 giờ trước thời điểm nhận xe của booking `paid`
- **THEN** cron job gửi email nhắc nhở cho buyer: địa điểm nhận xe, giờ, thông tin liên hệ chủ xe

---

### Requirement: Email Notifications — Listing Events
Hệ thống SHALL gửi email khi trạng thái listing thay đổi do admin: duyệt listing → email chúc mừng cho chủ xe; từ chối listing → email kèm lý do cụ thể và hướng dẫn chỉnh sửa.

#### Scenario: Email thông báo listing được duyệt
- **WHEN** admin duyệt listing
- **THEN** chủ xe nhận email "Tin đăng [Tên xe] đã được duyệt và hiển thị công khai" kèm link tới trang listing

#### Scenario: Email thông báo listing bị từ chối
- **WHEN** admin từ chối listing
- **THEN** chủ xe nhận email với lý do từ chối và hướng dẫn chỉnh sửa, kèm nút "Chỉnh sửa tin đăng"

---

### Requirement: Email Notifications — Account Events
Hệ thống SHALL gửi email cho các sự kiện tài khoản: xác thực email sau đăng ký, đặt lại mật khẩu, và xác minh dealer.

#### Scenario: Email xác thực sau đăng ký
- **WHEN** người dùng hoàn thành form đăng ký
- **THEN** hệ thống gửi email trong vòng 1 phút với link xác thực (token hết hạn 24 giờ)

#### Scenario: Email đặt lại mật khẩu
- **WHEN** người dùng nhập email trên trang "Quên mật khẩu"
- **THEN** hệ thống gửi email với link reset password (hết hạn 1 giờ). Nếu email không tồn tại, hệ thống vẫn hiển thị "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn" (tránh tiết lộ email)

---

### Requirement: Notification Preferences
Người dùng SHALL có thể quản lý tùy chọn nhận thông báo trong Settings: bật/tắt riêng từng loại thông báo (email / in-app). Thông báo bảo mật (email xác thực, reset mật khẩu) SHALL KHÔNG thể tắt.

#### Scenario: Tắt email nhắc nhở
- **WHEN** buyer tắt tùy chọn "Email nhắc nhở giao xe" trong Settings
- **THEN** hệ thống không gửi email nhắc nhở 24 giờ cho buyer đó, nhưng vẫn gửi in-app notification

#### Scenario: Không thể tắt email bảo mật
- **WHEN** người dùng vào Settings và cố tắt "Email xác thực"
- **THEN** toggle bị disable và hiển thị tooltip "Thông báo bảo mật không thể tắt"

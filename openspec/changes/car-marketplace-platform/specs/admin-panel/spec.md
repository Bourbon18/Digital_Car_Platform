## ADDED Requirements

### Requirement: Listing Moderation
Admin SHALL có giao diện để xem danh sách listing đang ở trạng thái `pending` và thực hiện: Duyệt (chuyển sang `active`) hoặc Từ chối (chuyển sang `rejected` kèm lý do). Admin SHALL có thể xem đầy đủ thông tin listing bao gồm ảnh, thông tin xe, và thông tin người đăng. Khi duyệt/từ chối, hệ thống SHALL gửi notification cho chủ listing.

#### Scenario: Admin duyệt listing
- **WHEN** admin nhấn "Duyệt" trên listing `pending`
- **THEN** hệ thống chuyển trạng thái listing thành `active`, listing hiển thị công khai, và gửi notification "Tin đăng của bạn đã được duyệt" cho chủ xe

#### Scenario: Admin từ chối listing
- **WHEN** admin nhấn "Từ chối" và điền lý do (ví dụ: "Ảnh không rõ, vui lòng upload lại")
- **THEN** hệ thống chuyển trạng thái thành `rejected`, gửi notification cho chủ xe kèm lý do từ chối

#### Scenario: Admin xem hàng đợi pending
- **WHEN** admin truy cập `/admin/listings?status=pending`
- **THEN** hệ thống hiển thị danh sách listing `pending` sắp xếp theo thời gian chờ lâu nhất

---

### Requirement: User Management
Admin SHALL có thể xem danh sách người dùng, tìm kiếm theo email/tên, và thực hiện: kích hoạt/vô hiệu hóa tài khoản, thay đổi role, xem lịch sử hoạt động (số listing, booking, review). Admin SHALL có thể suspend tài khoản vi phạm — user bị suspend sẽ không thể đăng nhập.

#### Scenario: Admin suspend tài khoản spam
- **WHEN** admin nhấn "Suspend" trên tài khoản vi phạm và điền lý do
- **THEN** hệ thống set `user.status = suspended`, user không thể đăng nhập, tất cả listing active của user bị ẩn, và gửi email thông báo suspend

#### Scenario: Admin nâng cấp user thành dealer
- **WHEN** admin xác minh giấy phép kinh doanh và nhấn "Xác minh Dealer"
- **THEN** hệ thống cập nhật role từ `individual-seller` thành `dealer` và gửi email chúc mừng

---

### Requirement: Platform Dashboard & Analytics
Admin SHALL có dashboard tổng quan hiển thị: tổng số listing (theo trạng thái), tổng số user (theo role), số booking trong 30 ngày, tổng doanh thu từ phí giao dịch, và biểu đồ xu hướng theo tuần/tháng. Dữ liệu SHALL được cache và refresh mỗi giờ.

#### Scenario: Admin xem dashboard tổng quan
- **WHEN** admin đăng nhập và truy cập `/admin`
- **THEN** hệ thống hiển thị: 4 KPI cards (Listings, Users, Bookings 30d, Revenue), biểu đồ listing mới theo tuần, và bảng 5 listing pending cần duyệt gấp

#### Scenario: Xem chi tiết theo khoảng thời gian
- **WHEN** admin thay đổi bộ lọc từ "30 ngày" thành "Quý 1/2025"
- **THEN** hệ thống reload dữ liệu analytics cho khoảng thời gian đã chọn

---

### Requirement: Review Moderation
Admin SHALL có thể xem danh sách review bị báo cáo, đọc nội dung gốc, và quyết định: Giữ nguyên (dismiss report) hoặc Ẩn review (vi phạm). Admin SHALL không thể xóa vĩnh viễn review — chỉ ẩn khỏi public.

#### Scenario: Admin xem review bị báo cáo
- **WHEN** admin truy cập `/admin/reviews?reported=true`
- **THEN** hệ thống hiển thị danh sách review bị báo cáo kèm lý do, số lần bị báo cáo, và nội dung đầy đủ

#### Scenario: Admin dismiss report
- **WHEN** admin xem xét report và nhấn "Giữ nguyên review"
- **THEN** hệ thống đóng report, review tiếp tục hiển thị công khai, và gửi notification cho người báo cáo

---

### Requirement: Content Management — Car Brands & Models
Admin SHALL có thể quản lý danh mục hãng xe và model xe dùng trong form tạo listing. Thêm hãng mới, thêm model mới dưới hãng, và vô hiệu hóa model đã ngừng sản xuất. Danh mục này được dùng cho autocomplete trong form tạo listing và search filter.

#### Scenario: Admin thêm hãng xe mới
- **WHEN** admin nhấn "Thêm hãng" và nhập tên "VinFast" kèm logo
- **THEN** hệ thống thêm brand vào database, VinFast xuất hiện trong dropdown brand của form tạo listing

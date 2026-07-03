## ADDED Requirements

### Requirement: Browse Car Listings for Sale
Hệ thống SHALL hiển thị trang danh sách xe rao bán (`/mua-xe`) với listing type `for-sale` đang ở trạng thái `active`. Mỗi card listing SHALL hiển thị: ảnh đại diện, hãng/model/năm, số km, giá, địa điểm, và badge loại người đăng (Cá nhân / Đại lý). Trang SHALL hỗ trợ pagination (20 listing/trang).

#### Scenario: Xem trang mua xe
- **WHEN** khách hàng truy cập `/mua-xe`
- **THEN** hệ thống hiển thị danh sách 20 listing `for-sale` mới nhất với đầy đủ thông tin card

#### Scenario: Sang trang tiếp theo
- **WHEN** người dùng nhấn "Trang tiếp" hoặc click số trang
- **THEN** hệ thống load 20 listing tiếp theo mà không reload toàn bộ trang

---

### Requirement: Browse Car Listings for Rent
Hệ thống SHALL hiển thị trang danh sách xe cho thuê (`/thue-xe`) với listing type `for-rent` đang ở trạng thái `active`. Card cho thuê SHALL hiển thị thêm: giá/ngày và badge "Có sẵn" / "Đã đặt hết". Trang SHALL hỗ trợ lọc theo ngày thuê mong muốn để chỉ hiển thị xe còn available.

#### Scenario: Xem trang thuê xe
- **WHEN** khách hàng truy cập `/thue-xe`
- **THEN** hệ thống hiển thị danh sách xe cho thuê active với giá/ngày và trạng thái availability

#### Scenario: Lọc theo ngày thuê
- **WHEN** người dùng chọn ngày thuê từ 10/07 đến 15/07 trong filter
- **THEN** hệ thống chỉ hiển thị xe không có booking trong khoảng ngày đó

---

### Requirement: Contact Seller / Dealer
Hệ thống SHALL cung cấp form liên hệ trên trang listing `for-sale` để buyer gửi tin nhắn tới chủ xe. Tin nhắn SHALL được gửi qua email đến chủ xe và lưu trong hệ thống để theo dõi. Buyer MUST đăng nhập để gửi tin nhắn. Số điện thoại chủ xe chỉ được hiển thị sau khi buyer đã đăng nhập.

#### Scenario: Gửi tin nhắn liên hệ thành công
- **WHEN** buyer đã đăng nhập, điền nội dung và nhấn "Gửi liên hệ"
- **THEN** hệ thống lưu tin nhắn, gửi email notification cho chủ xe, và hiển thị toast "Đã gửi liên hệ"

#### Scenario: Cố gửi tin nhắn chưa đăng nhập
- **WHEN** khách vãng lai nhấn "Liên hệ" trên listing
- **THEN** hệ thống hiển thị modal mời đăng nhập với nút "Đăng nhập để liên hệ"

#### Scenario: Xem số điện thoại chủ xe
- **WHEN** buyer đã đăng nhập nhấn "Hiện số điện thoại"
- **THEN** hệ thống hiển thị số điện thoại chủ xe và ghi log lượt xem

---

### Requirement: Save Listing (Wishlist)
Hệ thống SHALL cho phép người dùng đã đăng nhập lưu listing vào danh sách yêu thích. Danh sách saved listings SHALL có thể truy cập từ `/dashboard/saved`. Tối đa 100 listings được lưu mỗi tài khoản. Khi listing bị xóa hoặc sold, hệ thống SHALL gửi notification cho người đã save.

#### Scenario: Lưu listing vào wishlist
- **WHEN** buyer đã đăng nhập nhấn icon tim trên listing card hoặc trang detail
- **THEN** hệ thống lưu listing vào wishlist, đổi icon tim thành màu đỏ, hiển thị toast "Đã lưu"

#### Scenario: Xem danh sách đã lưu
- **WHEN** buyer truy cập `/dashboard/saved`
- **THEN** hệ thống hiển thị tất cả listing đã lưu với trạng thái hiện tại (available / sold / deleted)

---

### Requirement: Seller Dashboard — Sales Management
`Individual-seller` và `dealer` SHALL có dashboard quản lý tin đăng bán xe: xem danh sách listing, số lượt xem, số lượt liên hệ, và trạng thái. Dealer SHALL thêm có thể xem tổng doanh số và xuất báo cáo CSV.

#### Scenario: Seller xem listing của mình
- **WHEN** seller truy cập `/dashboard/listings`
- **THEN** hệ thống hiển thị tất cả listing của seller kèm stats: lượt xem, lượt liên hệ, trạng thái

#### Scenario: Dealer xuất báo cáo
- **WHEN** dealer nhấn "Xuất báo cáo" với khoảng thời gian T1/2025 - T6/2025
- **THEN** hệ thống generate file CSV gồm: tên xe, ngày đăng, lượt xem, số liên hệ, và download tự động

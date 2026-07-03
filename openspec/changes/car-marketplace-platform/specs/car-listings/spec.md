## ADDED Requirements

### Requirement: Create Car Listing
Hệ thống SHALL cho phép `individual-seller`, `individual-renter`, và `dealer` tạo tin đăng xe. Mỗi listing MUST bao gồm: hãng xe, model, năm sản xuất, số km đã đi (với xe cũ), màu sắc, tình trạng (mới/cũ), loại giao dịch (`for-rent` hoặc `for-sale`), giá, mô tả, và ít nhất 1 ảnh. Listing mới SHALL có trạng thái `pending` cho đến khi admin duyệt.

#### Scenario: Tạo listing thành công
- **WHEN** seller submit form tạo listing với tất cả trường bắt buộc hợp lệ và ít nhất 1 ảnh
- **THEN** hệ thống lưu listing với trạng thái `pending`, trả về listing ID, và gửi notification cho admin

#### Scenario: Tạo listing thiếu ảnh
- **WHEN** seller submit form tạo listing nhưng chưa upload ảnh nào
- **THEN** hệ thống hiển thị lỗi validation "Vui lòng upload ít nhất 1 ảnh xe" và KHÔNG tạo listing

#### Scenario: Vượt giới hạn listing cá nhân
- **WHEN** `individual-seller` hoặc `individual-renter` cố tạo listing thứ 6 trong ngày
- **THEN** hệ thống từ chối với thông báo "Bạn đã đạt giới hạn 5 tin đăng mới mỗi ngày"

---

### Requirement: Car Image Upload
Hệ thống SHALL cho phép upload tối đa 10 ảnh mỗi listing. Mỗi ảnh MUST ≤ 5MB, định dạng JPG/PNG/WebP. Hệ thống SHALL tự động nén ảnh xuống tối đa 800KB và convert sang WebP khi lưu lên Cloudinary. Người dùng SHALL có thể kéo thả để sắp xếp thứ tự ảnh, ảnh đầu tiên là ảnh đại diện (thumbnail).

#### Scenario: Upload ảnh hợp lệ
- **WHEN** seller upload file ảnh JPG 3MB
- **THEN** hệ thống upload lên Cloudinary, trả về URL ảnh đã nén và URL thumbnail (400x300px), hiển thị preview trong form

#### Scenario: Upload ảnh vượt kích thước
- **WHEN** seller upload file ảnh > 5MB
- **THEN** hệ thống hiển thị lỗi "Ảnh quá lớn, tối đa 5MB mỗi ảnh" và KHÔNG upload

#### Scenario: Sắp xếp thứ tự ảnh
- **WHEN** seller kéo thả để đổi thứ tự ảnh trong form
- **THEN** hệ thống cập nhật mảng `imageOrder` và lưu thứ tự mới khi submit

---

### Requirement: Edit Car Listing
Hệ thống SHALL cho phép chủ listing chỉnh sửa thông tin xe đang ở trạng thái `draft`, `pending`, hoặc `active`. Sau khi sửa listing đang `active`, trạng thái SHALL tự động chuyển về `pending` để admin review lại. Chủ listing SHALL không thể chỉnh sửa listing đang có booking `active`.

#### Scenario: Sửa listing active
- **WHEN** seller chỉnh sửa listing đang ở trạng thái `active`
- **THEN** hệ thống lưu thay đổi và chuyển trạng thái listing về `pending`, hiển thị thông báo "Tin đăng đang chờ duyệt lại"

#### Scenario: Cố sửa listing đang được thuê
- **WHEN** seller cố chỉnh sửa listing có booking đang ở trạng thái `active`
- **THEN** hệ thống từ chối với thông báo "Không thể sửa tin đăng đang có giao dịch trong tiến trình"

---

### Requirement: Delete Car Listing
Hệ thống SHALL cho phép chủ listing xóa (soft delete) listing của mình. Listing đang có booking `pending` hoặc `confirmed` SHALL không thể bị xóa — chủ listing phải hủy booking trước. Listing bị xóa SHALL ẩn khỏi public nhưng vẫn lưu trong database (trạng thái `deleted`).

#### Scenario: Xóa listing không có booking active
- **WHEN** seller xác nhận xóa listing không có booking đang hoạt động
- **THEN** hệ thống set trạng thái listing = `deleted`, ẩn khỏi tìm kiếm, hiển thị toast "Đã xóa tin đăng"

#### Scenario: Cố xóa listing có booking pending
- **WHEN** seller cố xóa listing đang có booking `pending` hoặc `confirmed`
- **THEN** hệ thống từ chối và hiển thị "Vui lòng hủy hoặc hoàn thành booking hiện tại trước khi xóa tin"

---

### Requirement: Listing Detail Page
Mỗi listing SHALL có trang chi tiết với URL SEO-friendly dạng `/xe/[slug]-[id]`. Trang SHALL hiển thị: gallery ảnh, thông tin xe đầy đủ, giá, thông tin chủ xe/đại lý, nút hành động (Đặt thuê / Liên hệ mua), và danh sách đánh giá. Trang SHALL được server-side rendered để tối ưu SEO, với meta tags đầy đủ (title, description, og:image).

#### Scenario: Truy cập trang listing detail
- **WHEN** người dùng truy cập URL `/xe/toyota-camry-2020-abc123`
- **THEN** hệ thống render trang với đầy đủ thông tin xe, ảnh gallery, và thông tin chủ xe

#### Scenario: Truy cập listing đã xóa hoặc không tồn tại
- **WHEN** người dùng truy cập URL của listing có trạng thái `deleted` hoặc ID không tồn tại
- **THEN** hệ thống trả về trang 404 với thông báo "Tin đăng không tồn tại hoặc đã bị xóa"

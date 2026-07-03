## ADDED Requirements

### Requirement: Full-Text Search
Hệ thống SHALL cung cấp thanh tìm kiếm trên header cho phép người dùng search bằng từ khóa (tên xe, hãng, model). Kết quả SHALL được trả về trong ≤ 500ms. Search SHALL hoạt động trên các trường: `brand`, `model`, `description`, `title`. Hệ thống SHALL dùng PostgreSQL full-text search với `tsvector` và `tsquery`.

#### Scenario: Tìm kiếm theo tên hãng xe
- **WHEN** người dùng nhập "Toyota" vào thanh tìm kiếm và nhấn Enter
- **THEN** hệ thống hiển thị tất cả listing active có brand = "Toyota" trong ≤ 500ms

#### Scenario: Tìm kiếm không có kết quả
- **WHEN** người dùng nhập chuỗi không khớp với listing nào
- **THEN** hệ thống hiển thị trạng thái "Không tìm thấy xe phù hợp" kèm gợi ý mở rộng từ khóa

#### Scenario: Search với từ khóa có dấu tiếng Việt
- **WHEN** người dùng nhập "xe ô tô cũ giá rẻ"
- **THEN** hệ thống tìm kiếm trong description và trả về listing có nội dung liên quan

---

### Requirement: Multi-Criteria Filter
Hệ thống SHALL cung cấp bộ lọc sidebar/top-bar trên trang listing với các tiêu chí: hãng xe (Brand), model, năm sản xuất (khoảng từ/đến), khoảng giá (từ/đến), tỉnh/thành phố, loại giao dịch (`for-rent` / `for-sale`), tình trạng xe (mới/cũ), số km tối đa. Các filter SHALL kết hợp AND logic. URL SHALL được cập nhật để phản ánh filter hiện tại (shareable URL).

#### Scenario: Lọc theo hãng và khoảng giá
- **WHEN** người dùng chọn Brand = "Honda" và Price = "300 - 500 triệu"
- **THEN** hệ thống hiển thị chỉ những xe Honda trong khoảng giá đó, URL update thành `?brand=Honda&priceMin=300000000&priceMax=500000000`

#### Scenario: Filter URL có thể chia sẻ
- **WHEN** người dùng copy URL đang có filter và paste vào browser khác
- **THEN** hệ thống hiển thị kết quả với cùng filter đã áp dụng

#### Scenario: Xóa tất cả filter
- **WHEN** người dùng nhấn "Xóa bộ lọc"
- **THEN** hệ thống reset tất cả filter, URL trở về `/mua-xe` hoặc `/thue-xe`, và hiển thị toàn bộ listing

---

### Requirement: Sort Results
Hệ thống SHALL cho phép sắp xếp kết quả listing theo: Mới nhất (default), Giá tăng dần, Giá giảm dần, Phổ biến nhất (lượt xem), và Đánh giá cao nhất. Lựa chọn sort SHALL được lưu trong URL param `?sort=price_asc`.

#### Scenario: Sắp xếp theo giá tăng dần
- **WHEN** người dùng chọn "Giá tăng dần" trong dropdown sort
- **THEN** hệ thống re-render danh sách với xe giá thấp nhất hiển thị trước, URL update `?sort=price_asc`

---

### Requirement: Location-Based Filter
Hệ thống SHALL hỗ trợ lọc xe theo tỉnh/thành phố dựa trên danh sách 63 tỉnh/thành của Việt Nam. Người dùng SHALL có thể chọn từ dropdown hoặc bật "Gần tôi" để lọc theo vị trí hiện tại (nếu browser cho phép geolocation, tìm xe trong bán kính 50km).

#### Scenario: Lọc theo tỉnh thành
- **WHEN** người dùng chọn "TP. Hồ Chí Minh" trong filter tỉnh thành
- **THEN** hệ thống hiển thị chỉ listing có `location.city = "ho-chi-minh"`

#### Scenario: Lọc theo vị trí hiện tại
- **WHEN** người dùng bật "Gần tôi" và browser xác nhận quyền location
- **THEN** hệ thống tính khoảng cách và hiển thị xe trong bán kính 50km theo thứ tự gần nhất

#### Scenario: Browser từ chối quyền location
- **WHEN** người dùng bật "Gần tôi" nhưng từ chối cấp quyền location
- **THEN** hệ thống hiển thị thông báo "Vui lòng cho phép truy cập vị trí" và fallback về lọc theo tỉnh thành

---

### Requirement: Search Suggestions (Autocomplete)
Hệ thống SHALL hiển thị dropdown gợi ý khi người dùng nhập ≥ 2 ký tự vào ô tìm kiếm. Gợi ý SHALL bao gồm: tên hãng xe phổ biến, model xe, và từ khóa search gần đây của người dùng. Gợi ý được debounce 300ms để không spam API.

#### Scenario: Gợi ý khi nhập từ khóa
- **WHEN** người dùng nhập "Toy" vào ô tìm kiếm
- **THEN** sau 300ms, hệ thống hiển thị dropdown gợi ý: "Toyota Camry", "Toyota Fortuner", "Toyota Vios"

#### Scenario: Không có gợi ý
- **WHEN** người dùng nhập từ khóa không match hãng hoặc model nào
- **THEN** hệ thống hiển thị tùy chọn "Tìm kiếm '[từ khóa]'" để search toàn bộ listing

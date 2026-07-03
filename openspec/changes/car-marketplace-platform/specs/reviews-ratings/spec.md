## ADDED Requirements

### Requirement: Submit Review After Completed Rental
Hệ thống SHALL cho phép buyer viết đánh giá (1-5 sao + nội dung văn bản) cho xe và chủ xe sau khi booking chuyển sang trạng thái `completed`. Buyer chỉ được phép đánh giá một lần mỗi booking. Review SHALL được hiển thị công khai sau khi submit (không cần admin duyệt). Review text MUST tối thiểu 10 ký tự và tối đa 500 ký tự.

#### Scenario: Buyer submit review thành công
- **WHEN** buyer chọn 4 sao, nhập nội dung review ≥ 10 ký tự, và nhấn "Gửi đánh giá" trên booking đã `completed`
- **THEN** hệ thống lưu review, cập nhật rating trung bình của listing, gửi notification cho chủ xe, và hiển thị review ngay trên trang listing

#### Scenario: Cố đánh giá booking chưa hoàn thành
- **WHEN** buyer cố truy cập form review của booking đang ở trạng thái `active` hoặc `confirmed`
- **THEN** hệ thống ẩn form review và hiển thị "Bạn có thể đánh giá sau khi hoàn thành thuê xe"

#### Scenario: Cố đánh giá lần hai cùng booking
- **WHEN** buyer cố submit review thứ hai cho cùng một booking đã được đánh giá
- **THEN** hệ thống trả về HTTP 409 "Bạn đã đánh giá giao dịch này rồi"

---

### Requirement: Display Ratings on Listing
Hệ thống SHALL hiển thị điểm đánh giá trung bình (tính theo trung bình cộng, làm tròn 0.5) và tổng số lượt đánh giá trên trang listing detail. Danh sách review SHALL được hiển thị theo thứ tự mới nhất, phân trang 10 review mỗi trang. Rating trung bình SHALL được cập nhật ngay sau mỗi review mới.

#### Scenario: Hiển thị rating trên listing
- **WHEN** người dùng truy cập listing có 15 reviews với rating trung bình 4.3
- **THEN** hệ thống hiển thị "★ 4.3 (15 đánh giá)" và 10 review mới nhất với nút "Xem thêm"

#### Scenario: Listing chưa có review
- **WHEN** người dùng truy cập listing mới chưa có review nào
- **THEN** hệ thống hiển thị "Chưa có đánh giá nào" thay vì rating 0 sao

---

### Requirement: Review for Car Purchase Inquiry
Hệ thống SHALL cho phép buyer đánh giá trải nghiệm liên hệ với seller/dealer sau khi đã gửi inquiry (contact message). Đánh giá này là optional và chỉ đánh giá seller (không có rating xe vì chưa hoàn tất giao dịch). Rating seller sẽ hiển thị trên profile của seller/dealer.

#### Scenario: Đánh giá seller sau liên hệ
- **WHEN** buyer đã gửi contact message cho seller và nhấn "Đánh giá" trong lịch sử liên hệ
- **THEN** hệ thống hiển thị form đánh giá seller (1-5 sao) và lưu vào seller profile sau khi submit

---

### Requirement: Report Inappropriate Review
Hệ thống SHALL cho phép chủ xe báo cáo review vi phạm (spam, ngôn từ thô tục, sai sự thật). Review bị báo cáo SHALL được admin xem xét. Nếu admin xác nhận vi phạm, review SHALL bị ẩn (không xóa vĩnh viễn) và không tính vào rating trung bình.

#### Scenario: Báo cáo review spam
- **WHEN** chủ xe nhấn "Báo cáo" trên một review và chọn lý do "Spam / Nội dung không liên quan"
- **THEN** hệ thống tạo report record và gửi notification cho admin để xem xét

#### Scenario: Admin ẩn review vi phạm
- **WHEN** admin xem xét report và nhấn "Ẩn review"
- **THEN** hệ thống set `review.hidden = true`, loại review khỏi tính điểm trung bình, và gửi email thông báo cho buyer đã viết review

## ADDED Requirements

### Requirement: User Registration
Hệ thống SHALL cho phép người dùng mới đăng ký tài khoản bằng email và mật khẩu. Người dùng SHALL chọn vai trò khi đăng ký: `buyer` (mua/thuê xe), `individual-seller` (bán/cho thuê xe cá nhân), hoặc `dealer` (đại lý/doanh nghiệp). Mật khẩu MUST được hash bằng bcrypt (cost factor ≥ 12) trước khi lưu vào database.

#### Scenario: Đăng ký thành công với email mới
- **WHEN** người dùng submit form đăng ký với email hợp lệ, mật khẩu ≥ 8 ký tự, và chọn vai trò
- **THEN** hệ thống tạo tài khoản mới với trạng thái `unverified`, gửi email xác thực, và redirect về trang thông báo "Kiểm tra email của bạn"

#### Scenario: Đăng ký thất bại vì email đã tồn tại
- **WHEN** người dùng submit form đăng ký với email đã được đăng ký trong hệ thống
- **THEN** hệ thống hiển thị lỗi "Email này đã được sử dụng" và KHÔNG tạo tài khoản mới

#### Scenario: Đăng ký thất bại vì mật khẩu yếu
- **WHEN** người dùng submit form đăng ký với mật khẩu ít hơn 8 ký tự
- **THEN** hệ thống hiển thị lỗi validation "Mật khẩu phải có ít nhất 8 ký tự" trước khi gọi API

---

### Requirement: Email Verification
Hệ thống SHALL yêu cầu người dùng xác thực email trước khi có thể đăng tin hoặc đặt xe. Token xác thực MUST hết hạn sau 24 giờ. Tài khoản `unverified` SHALL chỉ có thể đăng nhập và xem listing, không thể tạo listing hoặc booking.

#### Scenario: Xác thực email thành công
- **WHEN** người dùng nhấn vào link xác thực hợp lệ trong email (token còn hạn)
- **THEN** hệ thống cập nhật trạng thái tài khoản thành `active` và redirect về trang dashboard

#### Scenario: Token xác thực hết hạn
- **WHEN** người dùng nhấn vào link xác thực đã hết hạn (> 24 giờ)
- **THEN** hệ thống hiển thị thông báo "Link đã hết hạn" và cung cấp nút "Gửi lại email xác thực"

---

### Requirement: User Login
Hệ thống SHALL cho phép người dùng đăng nhập bằng email và mật khẩu. Hệ thống SHALL issue JWT access token (15 phút) và refresh token (30 ngày) khi đăng nhập thành công. Sau 5 lần đăng nhập thất bại liên tiếp, hệ thống SHALL khóa IP trong 15 phút.

#### Scenario: Đăng nhập thành công
- **WHEN** người dùng submit email và mật khẩu đúng
- **THEN** hệ thống set session cookie, cập nhật `lastLoginAt`, và redirect về trang trước đó hoặc dashboard

#### Scenario: Đăng nhập thất bại — sai mật khẩu
- **WHEN** người dùng submit email đúng nhưng mật khẩu sai
- **THEN** hệ thống hiển thị lỗi "Email hoặc mật khẩu không đúng" (không tiết lộ email có tồn tại hay không)

#### Scenario: Rate limit đăng nhập
- **WHEN** cùng một IP thực hiện 5 lần đăng nhập thất bại trong vòng 5 phút
- **THEN** hệ thống từ chối request tiếp theo với HTTP 429 và thông báo "Thử lại sau 15 phút"

---

### Requirement: User Profile Management
Người dùng SHALL có thể cập nhật thông tin cá nhân: tên hiển thị, số điện thoại, địa chỉ, ảnh đại diện. Dealer SHALL có thêm trường: tên doanh nghiệp, địa chỉ showroom, giấy phép kinh doanh (upload file). Số điện thoại MUST được validate định dạng Việt Nam (10-11 số, bắt đầu bằng 0).

#### Scenario: Cập nhật thông tin cá nhân thành công
- **WHEN** người dùng submit form cập nhật profile với dữ liệu hợp lệ
- **THEN** hệ thống lưu thay đổi và hiển thị toast "Cập nhật thành công"

#### Scenario: Dealer upload giấy phép kinh doanh
- **WHEN** dealer upload file giấy phép kinh doanh (PDF/JPG/PNG, ≤ 5MB)
- **THEN** hệ thống lưu file lên Cloudinary, gắn URL vào profile dealer, và đặt trạng thái `pending-verification` cho dealer account

---

### Requirement: Role-Based Access Control (RBAC)
Hệ thống SHALL phân quyền theo vai trò: `buyer` chỉ có thể xem và đặt xe/mua xe; `individual-seller` có thể tạo listing cho thuê hoặc bán xe cá nhân; `dealer` có thể tạo listing thương mại và xem dashboard doanh thu; `admin` có toàn quyền. JWT payload SHALL chứa `role` và `userId`.

#### Scenario: Buyer cố gắng tạo listing
- **WHEN** user có role `buyer` gọi API `POST /api/listings`
- **THEN** hệ thống trả về HTTP 403 "Bạn không có quyền đăng tin"

#### Scenario: Admin truy cập admin panel
- **WHEN** user có role `admin` truy cập route `/admin`
- **THEN** hệ thống cho phép truy cập và hiển thị admin dashboard

#### Scenario: Middleware bảo vệ route
- **WHEN** người dùng chưa đăng nhập truy cập route được bảo vệ (ví dụ `/dashboard`)
- **THEN** hệ thống redirect về trang `/login?callbackUrl=/dashboard`

## Why

Thị trường ô tô Việt Nam đang tăng trưởng mạnh nhưng chưa có một nền tảng thống nhất kết nối chủ xe cá nhân, người mua/bán xe cũ, và các đại lý chính hãng với khách hàng trong cùng một hệ sinh thái. Nhu cầu thuê xe ngắn/dài hạn, mua xe cũ giá tốt và tiếp cận xe chính hãng từ đại lý đang bị phân mảnh qua nhiều kênh riêng lẻ — cần một marketplace tập trung để giải quyết tất cả trong một nơi.

## What Changes

- **Nền tảng marketplace ô tô hoàn toàn mới** được xây dựng từ đầu (greenfield)
- Hỗ trợ **3 loại người dùng đăng tin**: cá nhân cho thuê xe, cá nhân bán xe cũ, đại lý/doanh nghiệp bán xe mới/cũ chính hãng
- Hỗ trợ **3 nghiệp vụ chính**: thuê xe (rental), mua xe (purchase), bán xe (listing)
- Hệ thống **tìm kiếm và lọc nâng cao** theo hãng, model, năm, giá, địa điểm, loại giao dịch
- **Đặt lịch thuê xe** với calendar, pricing theo ngày/tuần/tháng, quản lý trả xe
- **Tích hợp thanh toán** cho giao dịch thuê xe và hỗ trợ quy trình mua xe
- **Hệ thống đánh giá & nhận xét** cho xe và người dùng
- **Bảng quản trị (Admin Panel)** để kiểm duyệt tin đăng, quản lý người dùng
- **Thông báo** (email + in-app) cho các sự kiện quan trọng: đặt xe, phê duyệt tin, tin nhắn mới

## Capabilities

### New Capabilities

- `user-auth`: Đăng ký, đăng nhập, phân quyền theo vai trò (buyer, individual-seller, individual-renter, dealer, admin). Hỗ trợ xác thực email và quản lý hồ sơ cá nhân/doanh nghiệp.
- `car-listings`: Tạo, chỉnh sửa, xóa và duyệt tin đăng xe — bao gồm thông tin xe (hãng, model, năm, số km, tình trạng), ảnh, giá và loại giao dịch (rental / for-sale).
- `rental-booking`: Hệ thống đặt lịch thuê xe với availability calendar, tính giá theo thời gian, xác nhận đặt xe, và quản lý trạng thái (pending → confirmed → active → completed).
- `car-marketplace`: Luồng mua bán xe — duyệt danh sách xe rao bán, xem chi tiết, liên hệ người bán/đại lý, và theo dõi tin đã quan tâm (saved listings).
- `search-filter`: Tìm kiếm full-text và lọc đa chiều (hãng, model, năm, khoảng giá, tỉnh/thành, loại giao dịch, tình trạng xe). Hỗ trợ sắp xếp theo giá, ngày đăng, độ phổ biến.
- `payment`: Xử lý thanh toán cho giao dịch thuê xe (deposit + total). Hỗ trợ các cổng thanh toán phổ biến tại Việt Nam (VNPay, Momo). Quản lý hoàn tiền khi hủy đặt xe.
- `reviews-ratings`: Người dùng đánh giá (1–5 sao) và nhận xét xe/chủ xe sau khi hoàn thành giao dịch. Hiển thị điểm trung bình trên listing.
- `admin-panel`: Bảng điều khiển quản trị để kiểm duyệt tin đăng, quản lý người dùng, xem báo cáo doanh thu và hoạt động giao dịch.
- `notifications`: Gửi thông báo email và in-app cho các sự kiện: đặt xe mới, phê duyệt/từ chối tin đăng, tin nhắn mới, nhắc nhở trả xe.

### Modified Capabilities

*(Không có — đây là dự án mới hoàn toàn)*

## Impact

- **Backend**: API server mới (Node.js/Express hoặc Next.js API routes), PostgreSQL database, Redis cho session/cache
- **Frontend**: Next.js với React — SSR cho SEO tốt trên trang listing
- **Storage**: Cloudinary hoặc AWS S3 cho ảnh xe
- **Payment**: Tích hợp VNPay SDK / Momo API
- **Auth**: JWT + Refresh token, bcrypt password hashing
- **Email**: Nodemailer hoặc SendGrid
- **Deployment**: Vercel (frontend) + Railway/Render (backend) hoặc VPS
- **Dependencies**: Prisma ORM, NextAuth.js, React Query, Tailwind CSS, Shadcn/UI

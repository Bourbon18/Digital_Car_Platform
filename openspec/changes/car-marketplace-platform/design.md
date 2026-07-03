## Context

Car marketplace platform cho thị trường Việt Nam — kết nối 3 nhóm người đăng tin (cá nhân cho thuê, cá nhân bán xe cũ, đại lý/doanh nghiệp) với khách hàng muốn thuê, mua, hoặc bán xe ô tô. Dự án greenfield, không có hệ thống cũ cần migrate. Ưu tiên SEO vì listing xe cần được Google index để tăng traffic organic. Thị trường mục tiêu: người dùng tại Việt Nam, hỗ trợ VND và cổng thanh toán nội địa.

## Goals / Non-Goals

**Goals:**
- Marketplace đa vai trò: individual-renter, individual-seller, dealer, buyer, admin
- Luồng thuê xe end-to-end: tìm xe → đặt lịch → thanh toán → xác nhận → hoàn trả
- Luồng mua/bán xe: đăng tin → duyệt → liên hệ → đàm phán
- Tìm kiếm + lọc nhanh trên toàn bộ listing
- SEO-friendly URL và metadata cho listing pages
- Admin panel kiểm duyệt tin đăng và quản lý người dùng

**Non-Goals:**
- Mobile native app (iOS/Android) — v1 chỉ web responsive
- Tích hợp bảo hiểm xe hoặc tài chính/vay mua xe
- Livestream hoặc video call xem xe trực tuyến
- Thị trường quốc tế (ngoài Việt Nam)
- Chat real-time (v1 dùng contact form → email)

## Decisions

### 1. Framework: Next.js (App Router) thay vì tách riêng Frontend + Backend

**Chọn**: Next.js 14 với App Router — full-stack trong một repo.

**Lý do**: Listing pages cần SSR/SSG để Google index nội dung xe. Next.js cho phép render HTML đầy đủ ở server, tối ưu Core Web Vitals. API Routes của Next.js đủ mạnh cho REST API nội bộ, giảm overhead vận hành so với deploy 2 service riêng.

**Thay thế đã xét**: Vite React SPA + Express backend — đơn giản hơn nhưng không có SSR, listing pages không được index tốt.

---

### 2. Database: PostgreSQL + Prisma ORM

**Chọn**: PostgreSQL (relational) + Prisma ORM.

**Lý do**: Dữ liệu marketplace có quan hệ phức tạp (User → Listing → Booking → Payment → Review). PostgreSQL xử lý tốt join nhiều bảng, hỗ trợ transaction ACID cho payment. Prisma cung cấp type-safety, auto-migration, và Prisma Studio để inspect data trong quá trình dev.

**Thay thế đã xét**: MongoDB — linh hoạt schema nhưng khó enforce relational integrity giữa booking và payment; không phù hợp với dữ liệu có cấu trúc chặt.

---

### 3. Authentication: NextAuth.js v5 + JWT

**Chọn**: NextAuth.js (Auth.js v5) với JWT strategy + bcrypt password hashing.

**Lý do**: NextAuth tích hợp sẵn với Next.js, hỗ trợ credential login và OAuth (Google, Facebook) trong cùng config. JWT stateless giảm database lookup mỗi request. Role-based access control (RBAC) được encode vào JWT payload.

**Thay thế đã xét**: Clerk / Supabase Auth — managed service, giảm setup nhưng phát sinh chi phí và lock-in vendor. Tự viết JWT hoàn toàn — quá nhiều boilerplate và dễ có lỗ hổng bảo mật.

---

### 4. Styling: Tailwind CSS + Shadcn/UI

**Chọn**: Tailwind CSS utility-first + Shadcn/UI component library.

**Lý do**: Tailwind cho phép build UI nhanh không cần đặt tên class. Shadcn/UI cung cấp components chất lượng cao (Dialog, Select, DatePicker, Table) với full source code — không bị vendor lock-in, có thể customize hoàn toàn theo brand.

**Thay thế đã xét**: Material UI / Ant Design — nhiều component hơn nhưng nặng, khó override style, không hợp với aesthetic marketplace ô tô Việt.

---

### 5. Image Storage: Cloudinary

**Chọn**: Cloudinary cho upload và serve ảnh xe.

**Lý do**: Ảnh xe cần transform (resize, compress, WebP conversion) để tối ưu tốc độ tải trang. Cloudinary cung cấp transformation URL on-the-fly, CDN global, và free tier 25GB đủ cho MVP. Upload trực tiếp từ browser lên Cloudinary (signed upload preset) tránh bottleneck qua server.

**Thay thế đã xét**: AWS S3 + CloudFront — mạnh hơn nhưng cần tự setup Lambda/Sharp cho image transformation. Vercel Blob — chưa hỗ trợ transformation.

---

### 6. Payment: VNPay Integration

**Chọn**: VNPay làm primary payment gateway, với kiến trúc cho phép thêm Momo v2.

**Lý do**: VNPay là cổng thanh toán phổ biến nhất tại Việt Nam, hỗ trợ nội địa, chuyển khoản ngân hàng, và ví điện tử. VNPay SDK có tài liệu tiếng Việt đầy đủ. Chỉ thu phí khi giao dịch thành công (không có phí hàng tháng cho MVP).

**Thay thế đã xét**: Stripe — không hỗ trợ VND natively, phức tạp cho merchant registration tại Việt Nam.

---

### 7. Caching & Session Store: Redis (Upstash)

**Chọn**: Upstash Redis (serverless Redis) cho rate limiting và cache hot listings.

**Lý do**: Listing search là thao tác đọc nhiều. Cache kết quả search phổ biến giảm tải PostgreSQL. Rate limiting API endpoints tránh spam listing. Upstash có free tier và REST API — không cần self-host Redis.

**Thay thế đã xét**: In-memory cache (Map) — không persist qua deploy, không hoạt động với serverless. Memcached — ít tính năng hơn Redis.

---

### 8. Deployment: Vercel + Supabase Postgres

**Chọn**: Vercel cho Next.js deployment, Supabase cho managed PostgreSQL.

**Lý do**: Vercel tích hợp native với Next.js — zero-config deploy, edge functions, preview deployments. Supabase cung cấp managed PostgreSQL với free tier, connection pooling (PgBouncer), và dashboard trực quan.

**Thay thế đã xét**: Railway — linh hoạt hơn nhưng cần config nhiều hơn. Self-hosted VPS — full control nhưng overhead ops lớn cho MVP.

## Risks / Trade-offs

**[Risk] VNPay sandbox khó test** → Dùng mock payment service trong development, chỉ test VNPay thật trong staging environment với tài khoản merchant test.

**[Risk] Listing spam từ tài khoản giả** → Admin approval workflow bắt buộc trước khi listing live. Rate limit số listing tạo mới mỗi ngày per user (5 listings/ngày cho cá nhân).

**[Risk] Chi phí Cloudinary tăng theo số lượng ảnh** → Giới hạn 10 ảnh/listing, nén ảnh xuống tối đa 800KB, lazy load ảnh. Scale lên S3 khi cần.

**[Risk] Booking conflict (double booking)** → Dùng PostgreSQL advisory lock hoặc `SELECT FOR UPDATE` khi tạo booking để tránh race condition. Availability calendar check và lock trong cùng một transaction.

**[Risk] Next.js App Router learning curve** → Team cần quen với Server Components, `use client` directive, và data fetching patterns. Dành 1-2 sprint đầu để setup foundation vững.

## Migration Plan

Dự án greenfield — không có migration từ hệ thống cũ.

**Deployment sequence:**
1. Setup Supabase project + Prisma schema migrations
2. Deploy Next.js lên Vercel (staging environment)
3. Configure Cloudinary upload preset và environment variables
4. Test VNPay sandbox end-to-end
5. Seed initial admin account và sample listings
6. Go-live: point domain → Vercel production

**Rollback**: Vercel instant rollback về deployment trước nếu có issue production.

## Open Questions

- Có cần hỗ trợ đăng nhập bằng số điện thoại (OTP SMS) thay vì chỉ email? → Cân nhắc v1.1 nếu có nhu cầu thực tế.
- Phí hoa hồng cho platform (commission model) hay free marketplace? → Business model cần xác định trước khi build payment flow.
- Có cần tính năng "test drive" booking (khác với rental) cho xe đang rao bán? → Defer sang v2.

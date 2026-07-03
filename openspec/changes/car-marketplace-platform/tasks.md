## 1. Project Setup & Infrastructure

- [x] 1.1 Khởi tạo Next.js 14 project với App Router, TypeScript, và ESLint
- [x] 1.2 Cài đặt dependencies: Prisma, NextAuth.js v5, Tailwind CSS, Shadcn/UI CLI
- [x] 1.3 Cài đặt thêm: React Query (TanStack Query), Zod, Cloudinary SDK, Nodemailer, bcrypt
- [ ] 1.4 Tạo Supabase project và lấy DATABASE_URL connection string ← **Cần tạo tại supabase.com**
- [x] 1.5 Setup Prisma với PostgreSQL provider và chạy `prisma init`
- [ ] 1.6 Tạo Cloudinary account, upload preset cho xe (unsigned upload), và lấy API keys ← **Cần tạo tại cloudinary.com**
- [x] 1.7 Cấu hình file `.env.local` với tất cả environment variables (DB, Auth, Cloudinary, VNPay, Email)
- [ ] 1.8 Setup Upstash Redis và kết nối qua REST API ← **Cần tạo tại upstash.com**
- [x] 1.9 Cấu hình Shadcn/UI với theme màu sắc phù hợp (primary color cho marketplace ô tô)
- [x] 1.10 Tạo layout cơ bản: Header (logo, nav, search bar, auth buttons), Footer

## 2. Database Schema (Prisma)

- [x] 2.1 Tạo model `User` với fields: id, email, passwordHash, name, phone, role (enum), status (enum), emailVerified, createdAt
- [x] 2.2 Tạo model `DealerProfile` với fields: userId (FK), businessName, showroomAddress, licenseUrl, verificationStatus
- [x] 2.3 Tạo model `Brand` và `CarModel` cho danh mục hãng xe và model
- [x] 2.4 Tạo model `Listing` với fields: id, userId (FK), title, slug, brandId, modelId, year, mileage, condition, listingType (enum: for-rent/for-sale), price, description, status (enum: draft/pending/active/rejected/deleted), location (city, address), createdAt
- [x] 2.5 Tạo model `ListingImage` với fields: listingId (FK), url, thumbnailUrl, order
- [x] 2.6 Tạo model `Booking` với fields: id, listingId (FK), buyerId (FK), startDate, endDate, totalAmount, depositAmount, status (enum), pickupLocation, createdAt
- [x] 2.7 Tạo model `Payment` với fields: id, bookingId (FK), amount, currency, method, vnpayTransactionNo, responseCode, status, createdAt
- [x] 2.8 Tạo model `Review` với fields: id, bookingId (FK), reviewerId (FK), listingId (FK), rating (1-5), content, hidden, createdAt
- [x] 2.9 Tạo model `Notification` với fields: id, userId (FK), type (enum), title, body, read, createdAt, expiresAt
- [x] 2.10 Tạo model `SavedListing` (wishlist) và model `ContactMessage` (liên hệ mua xe)
- [x] 2.11 Thêm index trên các trường thường xuyên query: listing.status, listing.listingType, listing.userId, booking.listingId
- [ ] 2.12 Chạy `prisma migrate dev` để tạo migration đầu tiên và seed data ← **Cần DATABASE_URL từ task 1.4**

## 3. Authentication (user-auth)

- [x] 3.1 Cấu hình NextAuth.js với Credentials provider (email/password) và Prisma adapter
- [x] 3.2 Implement API route `POST /api/auth/register`: validate input với Zod, check email unique, hash password bcrypt, tạo user, gửi verification email
- [x] 3.3 Tạo email verification token (crypto.randomUUID), lưu vào DB với expiry 24h
- [x] 3.4 Implement API route `GET /api/auth/verify-email?token=`: xác thực token, update user status → active
- [x] 3.5 Implement `POST /api/auth/resend-verification`: gửi lại email xác thực
- [x] 3.6 Implement `POST /api/auth/forgot-password` và `POST /api/auth/reset-password`: tạo/validate reset token (1h expiry)
- [x] 3.7 Tạo Next.js middleware (`middleware.ts`) bảo vệ routes cần auth (`/dashboard/*`, `/admin/*`), redirect về `/login?callbackUrl=...`
- [x] 3.8 Implement RBAC middleware helper: `requireRole(role)` dùng trong Server Actions và API routes
- [x] 3.9 Cài đặt rate limiting cho `/api/auth/login` dùng Upstash Redis (5 attempts / 5 phút / IP)
- [x] 3.10 Build trang `/register` với form: email, password, confirm password, chọn role (dropdown)
- [x] 3.11 Build trang `/login` với form email/password và link "Quên mật khẩu"
- [x] 3.12 Build trang `/dashboard/profile`: xem và chỉnh sửa thông tin cá nhân, upload ảnh đại diện
- [x] 3.13 Build trang profile đặc biệt cho dealer: thêm trường businessName, showroomAddress, upload giấy phép kinh doanh

## 4. Car Brand & Model Management

- [x] 4.1 Seed database với 20+ hãng xe phổ biến tại Việt Nam (Toyota, Honda, Ford, Hyundai, Kia, VinFast, Mazda...)
- [x] 4.2 Seed model xe phổ biến cho từng hãng (ít nhất 5 model/hãng)
- [x] 4.3 Build API `GET /api/brands` và `GET /api/brands/[brandId]/models` cho autocomplete trong form

## 5. Car Listings Management (car-listings)

- [x] 5.1 Build Server Action `createListing`: validate Zod schema, check rate limit (5/ngày), tạo listing với status `pending`
- [x] 5.2 Build Server Action `updateListing`: kiểm tra ownership, kiểm tra active booking, update listing → status `pending` nếu đang `active`
- [x] 5.3 Build Server Action `deleteListing`: kiểm tra không có booking pending/confirmed, soft delete (status → `deleted`)
- [x] 5.4 Implement Cloudinary upload flow: Server Action tạo signed upload URL, client upload trực tiếp lên Cloudinary, lưu URL vào `ListingImage`
- [x] 5.5 Implement auto-generate slug từ tên xe + ID (ví dụ: `toyota-camry-2020-abc123`)
- [x] 5.6 Build trang `/dang-tin` (form tạo listing): stepper 3 bước — Thông tin xe → Ảnh → Giá & chi tiết
- [x] 5.7 Implement drag-and-drop image reorder trong form upload (dùng @dnd-kit/sortable)
- [x] 5.8 Build trang `/xe/[slug]` (listing detail): SSR với generateMetadata, gallery ảnh, thông tin xe, rating, nút hành động
- [x] 5.9 Build trang `/dashboard/listings`: danh sách listing của seller kèm stats (views, contacts, status)
- [x] 5.10 Implement view counter: tăng `listing.viewCount` mỗi khi trang detail được load (debounce: 1 view/user/listing/giờ)

## 6. Search & Filter (search-filter)

- [x] 6.1 Tạo PostgreSQL full-text search index trên `listings` table: `tsvector` gồm brand, model, description, title
- [x] 6.2 Build API `GET /api/listings/search` với params: `q`, `listingType`, `brand`, `model`, `yearMin`, `yearMax`, `priceMin`, `priceMax`, `city`, `condition`, `sort`, `page`
- [x] 6.3 Implement location filter dùng danh sách 63 tỉnh/thành Việt Nam (hardcode enum)
- [x] 6.4 Implement geolocation filter: tính khoảng cách Haversine từ tọa độ user đến listing (lưu lat/lng cho listing)
- [x] 6.5 Build component `SearchBar` với autocomplete: debounce 300ms, gợi ý brand/model từ API `GET /api/suggestions?q=`
- [x] 6.6 Build component `FilterSidebar`: dropdowns cho brand, model (dynamic theo brand), year range, price range, city, condition
- [x] 6.7 Implement URL-based filter state: sync filter values với URL searchParams để link có thể share
- [x] 6.8 Build trang `/mua-xe` (browse for-sale listings) với SearchBar, FilterSidebar, grid listing cards, và sort dropdown
- [x] 6.9 Build trang `/thue-xe` (browse for-rent listings) với thêm date range picker để filter availability

## 7. Rental Booking System (rental-booking)

- [x] 7.1 Build API `GET /api/listings/[id]/availability`: trả về mảng ngày bị blocked (đã có booking confirmed/active)
- [x] 7.2 Implement availability calendar component (dùng react-day-picker): highlight ngày unavailable, disable chọn ngày quá khứ
- [x] 7.3 Implement price calculation logic: số ngày × giá/ngày, áp dụng weekly discount nếu ≥ 7 ngày
- [x] 7.4 Build Server Action `createBooking`: validate dates, lock ngày với `SELECT FOR UPDATE` transaction, tạo booking `pending`
- [x] 7.5 Build Server Action `confirmBooking` (dành cho chủ xe): chuyển `pending` → `confirmed`, trigger notification
- [x] 7.6 Build Server Action `rejectBooking` (dành cho chủ xe): chuyển `pending` → `rejected` kèm lý do, giải phóng dates
- [x] 7.7 Build Server Action `cancelBooking` (dành cho buyer): kiểm tra policy hoàn tiền, trigger refund nếu đủ điều kiện
- [x] 7.8 Build Server Action `completeBooking` (dành cho chủ xe): chuyển `active` → `completed`, mở khóa tính năng review
- [x] 7.9 Cài đặt cron job (Vercel Cron): 15 phút/lần — tự động chuyển booking `confirmed` quá 24h không thanh toán → `cancelled`
- [x] 7.10 Cài đặt cron job: mỗi ngày 8:00 sáng — gửi email nhắc nhở cho booking `paid` có startDate = ngày mai
- [x] 7.11 Build trang booking trong listing detail: date picker + price summary + nút "Đặt ngay"
- [x] 7.12 Build trang `/dashboard/bookings` (buyer): danh sách booking với filter theo trạng thái, nút Cancel
- [x] 7.13 Build trang `/dashboard/rentals` (chủ xe): danh sách booking nhận được, nút Confirm/Reject/Complete

## 8. Car Marketplace — Buy/Sell Flow (car-marketplace)

- [x] 8.1 Build component `ContactSellerForm`: textarea nội dung, nút gửi, hiển thị modal login nếu chưa auth
- [x] 8.2 Build Server Action `sendContactMessage`: lưu vào `ContactMessage`, gửi email đến seller
- [x] 8.3 Implement "Hiện số điện thoại" button: chỉ render số điện thoại khi user đã đăng nhập, log view
- [x] 8.4 Build Server Action `saveListing` / `unsaveListing`: toggle wishlist, kiểm tra limit 100 items
- [x] 8.5 Build trang `/dashboard/saved`: danh sách listing đã lưu với badge "Đã bán" / "Đã xóa" cho listing không còn active
- [x] 8.6 Build trang `/dashboard/messages` (seller): xem danh sách contact messages từ buyer
- [x] 8.7 Build Server Action `exportDealerReport`: query listings + contact stats của dealer trong date range, generate CSV response

## 9. Payment Integration — VNPay (payment)

- [ ] 9.1 Đăng ký tài khoản merchant VNPay sandbox và lấy `vnp_TmnCode`, `vnp_HashSecret` ← **Cần đăng ký tại sandbox.vnpayment.vn**
- [x] 9.2 Implement helper `createVNPayUrl(booking, returnUrl)`: tạo payment URL với đầy đủ params và HMAC-SHA512 signature
- [x] 9.3 Build API `POST /api/payment/create`: nhận bookingId, tạo VNPay URL, redirect buyer
- [x] 9.4 Build API `GET /api/payment/callback`: xác thực HMAC-SHA512 từ VNPay, cập nhật booking → `paid`, lưu payment record
- [x] 9.5 Implement idempotency check trong callback: kiểm tra `vnp_TransactionNo` đã tồn tại → bỏ qua nếu duplicate
- [x] 9.6 Implement refund logic: tính số tiền hoàn dựa trên thời gian hủy, gọi VNPay Refund API
- [x] 9.7 Build trang `/payment/success` và `/payment/failed` với thông tin giao dịch
- [x] 9.8 Build trang booking detail hiển thị: deposit amount, trạng thái thanh toán, VNPay transaction ID

## 10. Reviews & Ratings (reviews-ratings)

- [x] 10.1 Build Server Action `createReview`: kiểm tra booking đã `completed` và chưa có review, lưu review, recalculate listing averageRating
- [x] 10.2 Implement `recalculateRating(listingId)`: query AVG(rating) trên non-hidden reviews, update `listing.averageRating` và `listing.reviewCount`
- [x] 10.3 Build component `ReviewForm`: star rating picker (1-5), textarea content (10-500 ký tự), submit button
- [x] 10.4 Build component `ReviewList`: danh sách review với pagination (10/trang), tên reviewer, rating, date, content
- [x] 10.5 Tích hợp ReviewForm và ReviewList vào trang listing detail `/xe/[slug]`
- [x] 10.6 Build Server Action `reportReview`: tạo review report record, trigger admin notification
- [x] 10.7 Build Server Action `createSellerReview`: đánh giá seller sau contact inquiry, update seller averageRating
- [x] 10.8 Hiển thị seller rating trên trang profile dealer và listing cards của dealer

## 11. Notification System (notifications)

- [x] 11.1 Build helper `createNotification(userId, type, title, body)`: insert vào bảng `notifications` với expiresAt = now + 90 days
- [x] 11.2 Build API `GET /api/notifications`: trả về notifications của user hiện tại (unread first, limit 20)
- [x] 11.3 Build API `POST /api/notifications/read-all`: mark all as read cho user hiện tại
- [x] 11.4 Build component `NotificationBell`: hiển thị trên Header, badge unread count, dropdown list, polling mỗi 30s
- [x] 11.5 Setup email service với Nodemailer + Gmail SMTP (hoặc SendGrid free tier)
- [x] 11.6 Tạo email templates HTML (responsive) cho: booking events, listing events, account events
- [x] 11.7 Build email queue worker: xử lý email bất đồng bộ (dùng Vercel Edge Function hoặc background job)
- [x] 11.8 Tích hợp `createNotification` vào tất cả Server Actions liên quan (createBooking, confirmBooking, approveListings...)
- [x] 11.9 Build trang `/dashboard/settings/notifications`: toggle bật/tắt từng loại thông báo, disable cho security emails

## 12. Admin Panel (admin-panel)

- [x] 12.1 Tạo layout riêng cho `/admin` route group với sidebar navigation và bảo vệ bằng role `admin`
- [x] 12.2 Build trang `/admin` (Dashboard): 4 KPI cards (Listings, Users, Bookings 30d, Revenue), biểu đồ listing mới theo tuần, bảng pending listings
- [x] 12.3 Build trang `/admin/listings`: bảng listing với filter trạng thái, search, và action Duyệt/Từ chối
- [x] 12.4 Build modal "Xem chi tiết listing" trong admin: gallery ảnh, thông tin xe, thông tin seller
- [x] 12.5 Build Server Action `approveListing` và `rejectListing` (admin only): update status, gửi notification
- [x] 12.6 Build trang `/admin/users`: bảng user với search, filter role/status, action Suspend/Unsuspend/Change Role
- [x] 12.7 Build Server Action `suspendUser`: set status → `suspended`, ẩn listings active, gửi email
- [x] 12.8 Build Server Action `verifyDealer`: update role → `dealer`, gửi email xác nhận
- [x] 12.9 Build trang `/admin/reviews`: danh sách review bị báo cáo, action Giữ nguyên/Ẩn review
- [x] 12.10 Build Server Action `hideReview` (admin): set hidden = true, recalculate rating, notify reviewer
- [x] 12.11 Build trang `/admin/brands`: CRUD brands và models (thêm, sửa tên, disable/enable)

## 13. SEO & Performance

- [x] 13.1 Implement `generateMetadata` cho trang listing detail: title = "Tên xe + Năm | Mua/Thuê Xe", description từ listing, og:image từ ảnh đại diện
- [x] 13.2 Tạo `sitemap.xml` động cho tất cả listing active (Next.js sitemap route)
- [x] 13.3 Implement `robots.txt` (disallow admin routes, allow listing pages)
- [x] 13.4 Thêm JSON-LD structured data (Schema.org `Product`) vào trang listing detail
- [x] 13.5 Optimize images: dùng Next.js `<Image>` component với Cloudinary loader, lazy loading
- [x] 13.6 Implement listing page cache: `revalidate = 300` (5 phút) với ISR

## 14. Testing & Deployment

- [ ] 14.1 Viết unit tests cho business logic: price calculation, refund policy, rating recalculation
- [ ] 14.2 Viết integration tests cho booking flow: create → confirm → pay → complete
- [ ] 14.3 Test VNPay payment flow end-to-end trong staging environment ← **Cần task 9.1**
- [ ] 14.4 Setup Vercel project, kết nối với GitHub repo, cấu hình environment variables production
- [ ] 14.5 Chạy `prisma migrate deploy` trên Supabase production database ← **Cần task 1.4**
- [ ] 14.6 Seed production database: admin account, brand/model data ← **Cần task 1.4**
- [ ] 14.7 Kiểm tra toàn bộ user flows: đăng ký → đăng tin → duyệt → thuê → thanh toán → review
- [ ] 14.8 Performance check: Lighthouse score ≥ 80 cho trang listing detail
- [ ] 14.9 Cấu hình domain thực và SSL certificate (Vercel tự động)
- [x] 14.10 Setup Vercel Cron Jobs cho email nhắc nhở và auto-cancel booking

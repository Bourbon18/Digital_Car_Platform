# 🇬🇧 Fast — Digital Car Platform

*A digital platform for renting, buying, and selling cars — fully bilingual (English / Tiếng Việt).*

### Why I built this

I'm someone who is genuinely passionate about cars and enjoys everything about them, and I also have a bit of understanding of how different business models work. I kept coming back to an idea around **renting, buying, and reselling cars**, and at the same time I really wanted to try my hand at building a real web application. **Fast** is the result of that — a personal project where I turned an idea I care about into a working, end-to-end platform.

### About Fast

Fast is a digital platform that brings the entire car **rental, purchase, and resale** experience online. Instead of scattered social-media posts and messy manual haggling, it gathers private owners, professional dealers, and buyers into one place — where every listing is moderated, every rental follows a clear booking process, and deposits are handled transparently through bank-QR transfers.

The platform is designed to serve three groups at the same time: **individuals** who want to rent out or sell their own car, **dealers and businesses** who want to showcase and manage a larger inventory, and **customers** who want to rent or buy a vehicle quickly. Listings pass through admin moderation to keep information accurate and trustworthy, sellers can grow their reach through subscription plans and featured listings, and the whole interface is available in **both English and Vietnamese** so it feels natural to a wider audience.

Under the hood, Fast is built as a full-stack web application meant to feel like a realistic product — covering authentication, listings, bookings, payments, reviews, messaging, subscriptions, notifications, and a complete admin back office.

### Features

**Browsing & discovery**
- Separate flows for **buying** and **renting**, covering both new and used vehicles from private owners and dealers.
- Powerful search with filters by **brand, model, year, price range, city, and listing type**, plus sorting by newest, price, popularity, or rating.
- Rich listing detail pages with an **image gallery**, full specifications (year, mileage, condition, color, location), seller/dealer information, and status badges (**Verified**, **Featured**, **New**).
- **Save** listings to a personal shortlist to revisit later.

**Communication & trust**
- **In-app messaging** to chat directly with sellers or owners.
- **Reviews & ratings** left by real buyers/renters after a completed transaction, with the ability to **report** inappropriate reviews for moderation.

**Rental & booking**
- An end-to-end **booking flow**: choose the **pick-up and return dates**, review an automatic **price breakdown** (including a weekly-rental discount when it applies), pay a **30% deposit via bank-QR transfer**, then confirm the transfer.
- A full **status lifecycle** — pending → confirmed → paid → active → completed (or rejected / cancelled) — with owner actions to confirm, reject, hand over, and complete.
- Expired or unconfirmed bookings are **cancelled automatically**.

**Selling & managing (owners / dealers)**
- Create, edit, and delete listings with **multi-image upload** (via Cloudinary).
- Every listing is **moderated by admins** before it goes public.
- Set up a personal **payment QR + bank details** to receive deposits.
- **Boost** listings into the featured spot for more visibility, using credits from your plan.
- A personal **dashboard** for listings, bookings, rentals, saved cars, notifications, subscription, and profile.

**Subscriptions & monetization**
- Three tiers — **Free, Pro, and Business** — differing in daily post limits, review priority, featured-boost credits, number of payment channels, and the **verified-dealer badge**.
- **Manual QR activation**: the user transfers the payment and uploads proof; an admin reviews it and activates the plan.
- **Renew / extend** the current plan before it expires — remaining days are carried over instead of being lost.
- **Business multi-channel payments**: add several payment-QR channels with a live **expiry countdown**, **near-expiry reminders**, and automatic cleanup of the extra channels when the plan ends.

**Accounts, notifications & security**
- **Role-based accounts**: buyer, individual seller, individual renter, dealer, and admin.
- **Email verification**, **password reset**, and **email change** (with a cooldown) flows.
- **In-app and email notifications** with per-type preferences, plus message and notification bells.
- Account **suspension** handling across the whole app.

**Admin panel**
- A moderation back office with **dashboard stats**, listing approval/rejection (with reasons), **subscription proof review**, user management (suspend users, verify dealers), review moderation, and brand/model management.

**Platform & experience**
- Fully **bilingual (English / Tiếng Việt)** with an instant, cookie-based language switch that renders correctly on the server (SSR).
- Responsive design with a **liquid-glass header**, SEO (sitemap, robots, dynamic metadata), rate limiting, and **scheduled background jobs** (cron) for reminders and cleanup.

---

# 🇻🇳 Fast — Nền tảng ứng dụng số ô tô

*Nền tảng số để thuê, mua và bán ô tô — song ngữ hoàn toàn (English / Tiếng Việt).*

### Vì sao tôi làm dự án này

Tôi là một người đam mê và thực sự hứng thú với ô tô, đồng thời cũng biết một chút về các hình thức kinh doanh. Tôi luôn ấp ủ một **ý tưởng liên quan đến việc thuê / mua / bán ô tô**, và song song đó cũng rất muốn thử sức xây dựng một web app thực thụ. **Fast** chính là kết quả của điều đó — một dự án cá nhân nơi tôi biến một ý tưởng mình tâm đắc thành một nền tảng chạy được từ đầu đến cuối.

### Giới thiệu về Fast

Fast là một nền tảng số đưa toàn bộ trải nghiệm **thuê, mua và bán lại ô tô** lên môi trường trực tuyến. Thay vì những bài đăng rải rác trên mạng xã hội và việc trả giá thủ công lộn xộn, Fast gom chủ xe cá nhân, đại lý chuyên nghiệp và người mua về cùng một nơi — nơi mọi tin đăng đều được kiểm duyệt, mọi lượt thuê đều đi theo một quy trình đặt xe rõ ràng, và tiền cọc được xử lý minh bạch qua chuyển khoản QR ngân hàng.

Nền tảng được thiết kế để phục vụ đồng thời ba nhóm: **cá nhân** muốn cho thuê hoặc bán chiếc xe của mình, **đại lý và doanh nghiệp** muốn trưng bày và quản lý một kho xe lớn hơn, và **khách hàng** muốn thuê hoặc mua xe một cách nhanh chóng. Tin đăng đi qua khâu kiểm duyệt của admin để đảm bảo thông tin chính xác và đáng tin cậy, người bán có thể mở rộng phạm vi tiếp cận qua các gói dịch vụ và tin nổi bật, còn toàn bộ giao diện có sẵn **cả tiếng Anh lẫn tiếng Việt** để phù hợp với nhiều đối tượng hơn.

Về mặt kỹ thuật, Fast được xây dựng như một ứng dụng web full-stack, hướng tới cảm giác của một sản phẩm thực tế — bao gồm xác thực người dùng, tin đăng, đặt xe, thanh toán, đánh giá, nhắn tin, gói dịch vụ, thông báo và một trang quản trị hoàn chỉnh.

### Tính năng

**Tìm kiếm & khám phá**
- Luồng riêng cho **mua** và **thuê**, bao gồm cả xe mới lẫn xe cũ từ chủ xe cá nhân và đại lý.
- Tìm kiếm mạnh mẽ với bộ lọc theo **hãng, dòng xe, năm sản xuất, khoảng giá, tỉnh/thành và loại tin**, cùng sắp xếp theo mới nhất, giá, độ phổ biến hoặc đánh giá.
- Trang chi tiết tin đăng đầy đủ với **thư viện ảnh**, thông số (năm, số km, tình trạng, màu, vị trí), thông tin người bán/đại lý và các badge trạng thái (**Xác thực**, **Nổi bật**, **Xe mới**).
- **Lưu** tin vào danh sách cá nhân để xem lại sau.

**Trao đổi & tin cậy**
- **Nhắn tin trong ứng dụng** để trao đổi trực tiếp với người bán hoặc chủ xe.
- **Đánh giá & xếp hạng** từ người mua/thuê thực tế sau khi giao dịch hoàn tất, kèm khả năng **báo cáo** đánh giá vi phạm để kiểm duyệt.

**Thuê xe & đặt xe**
- **Quy trình đặt xe** trọn vẹn: chọn **ngày nhận và ngày trả**, xem **bảng tính giá tự động** (kèm ưu đãi thuê theo tuần khi đủ điều kiện), thanh toán **cọc 30% qua chuyển khoản QR**, rồi xác nhận chuyển khoản.
- **Vòng đời trạng thái** đầy đủ — chờ → đã xác nhận → đã cọc → đang thuê → hoàn thành (hoặc bị từ chối / hủy) — với các thao tác cho chủ xe: xác nhận, từ chối, bàn giao, hoàn thành.
- Booking quá hạn hoặc chưa được xác nhận sẽ **tự động bị hủy**.

**Đăng bán & quản lý (chủ xe / đại lý)**
- Tạo, sửa, xóa tin đăng với **tải nhiều ảnh** (qua Cloudinary).
- Mọi tin đăng đều được **admin kiểm duyệt** trước khi hiển thị công khai.
- Thiết lập **QR nhận tiền + thông tin ngân hàng** cá nhân để nhận cọc.
- **Đẩy tin nổi bật** để tăng hiển thị, dùng lượt đẩy tin từ gói dịch vụ.
- **Bảng điều khiển** cá nhân cho tin đăng, booking, cho thuê, tin đã lưu, thông báo, gói dịch vụ và hồ sơ.

**Gói dịch vụ & mô hình doanh thu**
- Ba hạng — **Free, Pro và Business** — khác nhau về hạn mức đăng tin/ngày, mức ưu tiên duyệt, số lượt đẩy tin nổi bật, số cổng nhận tiền và **badge đại lý xác thực**.
- **Kích hoạt bằng QR thủ công**: người dùng chuyển khoản và tải lên chứng từ; admin xét duyệt rồi kích hoạt gói.
- **Gia hạn / cộng dồn** gói đang dùng trước khi hết hạn — số ngày còn lại được cộng thêm thay vì mất đi.
- **Nhiều cổng thanh toán cho Business**: thêm nhiều cổng QR nhận tiền, kèm **đồng hồ đếm ngược hạn dùng**, **nhắc nhở khi sắp hết hạn**, và tự động dọn các cổng bổ sung khi gói kết thúc.

**Tài khoản, thông báo & bảo mật**
- **Tài khoản theo vai trò**: người mua, người bán cá nhân, chủ xe cho thuê, đại lý và admin.
- **Xác thực email**, **đặt lại mật khẩu** và **đổi email** (có thời gian chờ).
- **Thông báo trong ứng dụng và qua email** với tùy chỉnh theo từng loại, kèm chuông tin nhắn và thông báo.
- Xử lý **tạm khóa tài khoản** xuyên suốt ứng dụng.

**Trang quản trị (Admin)**
- Trang quản trị với **thống kê tổng quan**, duyệt/từ chối tin đăng (kèm lý do), **xét chứng từ mua gói**, quản lý người dùng (tạm khóa, xác thực đại lý), kiểm duyệt đánh giá và quản lý hãng/dòng xe.

**Nền tảng & trải nghiệm**
- **Song ngữ hoàn toàn (Anh / Việt)** với nút chuyển ngôn ngữ tức thì, lưu bằng cookie và hiển thị đúng ở phía máy chủ (SSR).
- Giao diện responsive với **header hiệu ứng liquid glass**, SEO (sitemap, robots, metadata động), giới hạn tần suất, và **tác vụ nền định kỳ** (cron) cho nhắc nhở và dọn dẹp.

---

## 🛠️ Tech Stack

| Layer / Tầng | Technology / Công nghệ |
|---|---|
| Framework | **Next.js 14** (App Router, Server Actions, Route Handlers) |
| Language | **TypeScript** |
| Auth | **NextAuth v5** (JWT sessions) |
| Database | **PostgreSQL** (Neon) + **Prisma ORM** |
| Styling | **Tailwind CSS**, **shadcn/ui**, **lucide-react** |
| Images | **Cloudinary** |
| Rate limiting | **Upstash Redis** |
| Email | **Nodemailer (SMTP)** |
| i18n | Cookie-based English / Vietnamese dictionaries |
| Hosting | **Vercel** (with Cron Jobs) |

## 🚀 Getting Started

```bash
# 1. Install dependencies / Cài đặt phụ thuộc
npm install

# 2. Configure environment / Cấu hình môi trường
cp .env.example .env.local   # then fill in your values / rồi điền các giá trị của bạn

# 3. Set up the database / Thiết lập cơ sở dữ liệu
npx prisma migrate deploy    # or / hoặc: npx prisma db push
npm run db:seed              # optional / tùy chọn: seed brands, models & demo data

# 4. Run the dev server / Chạy server dev
npm run dev                  # http://localhost:3000
```

Required environment variables are listed in [`.env.example`](./.env.example) — database, auth secret, Cloudinary, email, platform payment QR, and more.
*Các biến môi trường cần thiết được liệt kê trong [`.env.example`](./.env.example) — cơ sở dữ liệu, khóa bí mật xác thực, Cloudinary, email, QR nhận tiền của nền tảng, v.v.*

## 📄 License

Released under the **MIT License** — you are free to use, modify, and distribute this project.
*Phát hành theo giấy phép **MIT** — bạn được tự do sử dụng, chỉnh sửa và phân phối dự án này.*

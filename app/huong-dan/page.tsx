import { BookOpen, Car, MessageSquare, CreditCard, Search, Star, ShieldCheck } from "lucide-react";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.guide };
}

const ICONS = [
  <Search key="s" className="h-6 w-6 text-primary" />,
  <MessageSquare key="m" className="h-6 w-6 text-primary" />,
  <Car key="c" className="h-6 w-6 text-primary" />,
  <BookOpen key="b" className="h-6 w-6 text-primary" />,
  <CreditCard key="cc" className="h-6 w-6 text-primary" />,
  <Star key="st" className="h-6 w-6 text-primary" />,
  <ShieldCheck key="sh" className="h-6 w-6 text-primary" />,
];

const CONTENT = {
  vi: {
    title: "Hướng Dẫn Sử Dụng",
    subtitle: "Tổng hợp các bước sử dụng Fast dành cho người mua, người thuê và người đăng tin.",
    sections: [
      { title: "Tìm kiếm xe", steps: [
        "Truy cập mục Mua Xe hoặc Thuê Xe trên thanh điều hướng.",
        "Dùng bộ lọc để chọn hãng xe, mức giá, năm sản xuất, tỉnh thành.",
        "Nhấn vào tin đăng để xem thông tin chi tiết và ảnh xe.",
      ] },
      { title: "Liên hệ người bán", steps: [
        "Đăng nhập vào tài khoản (bắt buộc).",
        "Trong trang chi tiết xe, điền nội dung vào ô Liên Hệ Người Bán và nhấn Gửi.",
        "Người bán sẽ nhận thông báo và có thể trả lời qua phần Tin Nhắn.",
        "Bạn cũng có thể xem số điện thoại của người bán khi đã đăng nhập.",
      ] },
      { title: "Đặt thuê xe", steps: [
        "Vào trang xe muốn thuê, chọn ngày nhận — ngày trả và địa điểm nhận xe.",
        "Nhấn Đặt Thuê và xác nhận thông tin.",
        "Chờ người cho thuê xác nhận booking (thường trong vòng 24 giờ).",
        "Thanh toán theo hướng dẫn của người cho thuê (chuyển khoản QR).",
      ] },
      { title: "Đăng tin bán / cho thuê xe", steps: [
        "Đăng ký tài khoản với vai trò Người bán hoặc Cho thuê cá nhân.",
        "Vào mục Đăng Tin, điền đầy đủ thông tin xe và tải ảnh lên (tối đa 10 ảnh).",
        "Gửi tin đăng và chờ admin duyệt (thường trong 1–2 giờ làm việc).",
        "Sau khi được duyệt, tin đăng hiển thị công khai trên nền tảng.",
      ] },
      { title: "Thiết lập QR thanh toán", steps: [
        "Vào Hồ Sơ → mục QR Thanh Toán.",
        "Tải ảnh QR ngân hàng (VietQR, Momo, ZaloPay...) lên.",
        "Điền thông tin tài khoản ngân hàng để người thuê/mua dễ xác nhận.",
        "Nhấn Lưu. QR sẽ hiển thị cho khách khi thực hiện thanh toán.",
      ] },
      { title: "Đánh giá sau giao dịch", steps: [
        "Sau khi booking hoàn tất, bạn có thể để lại đánh giá cho xe và người cho thuê.",
        "Đánh giá giúp cộng đồng tin tưởng hơn và nền tảng hoạt động minh bạch.",
      ] },
      { title: "Bảo mật tài khoản", steps: [
        "Luôn xác thực email sau khi đăng ký để kích hoạt tài khoản.",
        "Không chia sẻ mật khẩu với bất kỳ ai, kể cả nhân viên Fast.",
        "Đổi mật khẩu ngay nếu nghi ngờ tài khoản bị xâm phạm.",
        "Tài khoản vi phạm có thể bị khóa mà không cần báo trước.",
      ] },
    ],
  },
  en: {
    title: "User Guide",
    subtitle: "How to use Fast — for buyers, renters and those posting listings.",
    sections: [
      { title: "Search for cars", steps: [
        "Go to Buy Cars or Rent Cars in the navigation bar.",
        "Use filters to select brand, price range, year and province.",
        "Click a listing to see full details and photos.",
      ] },
      { title: "Contact the seller", steps: [
        "Log in to your account (required).",
        "On the car detail page, fill in the Contact the Seller box and press Send.",
        "The seller gets a notification and can reply via Messages.",
        "You can also see the seller's phone number once logged in.",
      ] },
      { title: "Book a rental", steps: [
        "Open the car you want to rent, choose pickup — return dates and pickup location.",
        "Press Book and confirm the details.",
        "Wait for the owner to confirm the booking (usually within 24 hours).",
        "Pay following the owner's instructions (QR transfer).",
      ] },
      { title: "Post a car for sale / rent", steps: [
        "Register an account as an Individual Seller or Renter.",
        "Go to Post a Listing, fill in the car details and upload photos (up to 10).",
        "Submit and wait for admin approval (usually within 1–2 business hours).",
        "Once approved, your listing is shown publicly on the platform.",
      ] },
      { title: "Set up your payment QR", steps: [
        "Go to Profile → Payment QR.",
        "Upload a bank QR image (VietQR, Momo, ZaloPay...).",
        "Fill in your bank account info so buyers/renters can verify.",
        "Press Save. The QR is shown to customers when they pay.",
      ] },
      { title: "Review after a transaction", steps: [
        "After a booking is completed, you can leave a review for the car and the owner.",
        "Reviews build community trust and keep the platform transparent.",
      ] },
      { title: "Account security", steps: [
        "Always verify your email after signing up to activate your account.",
        "Never share your password with anyone, including Fast staff.",
        "Change your password immediately if you suspect your account is compromised.",
        "Violating accounts may be suspended without prior notice.",
      ] },
    ],
  },
};

export default function HuongDanPage() {
  const t = CONTENT[getServerLocale()] ?? CONTENT.vi;
  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-2">{t.subtitle}</p>
      </div>

      <div className="space-y-8">
        {t.sections.map((s, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {ICONS[i]}
              </div>
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <ol className="space-y-2 pl-1">
              {s.steps.map((step, j) => (
                <li key={j} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {j + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}

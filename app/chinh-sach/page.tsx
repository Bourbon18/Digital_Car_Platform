import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.policy };
}

const CONTENT = {
  vi: {
    title: "Chính Sách",
    updated: "Cập nhật lần cuối:",
    policies: [
      { title: "1. Điều khoản sử dụng", content: [
        "Fast là nền tảng kết nối người mua, người bán và người cho thuê xe ô tô. Chúng tôi không phải là bên trực tiếp trong các giao dịch giữa người dùng.",
        "Người dùng phải từ 18 tuổi trở lên và cung cấp thông tin trung thực khi đăng ký tài khoản.",
        "Nghiêm cấm đăng thông tin sai lệch, gian lận hoặc có hành vi lừa đảo trên nền tảng. Vi phạm sẽ bị khóa tài khoản vĩnh viễn.",
        "Fast có quyền xóa bất kỳ nội dung vi phạm mà không cần thông báo trước.",
      ] },
      { title: "2. Chính sách đăng tin", content: [
        "Mỗi tài khoản được đăng tối đa 5 tin trong vòng 24 giờ để tránh spam.",
        "Tin đăng phải có ảnh thực tế của xe, thông tin chính xác về năm sản xuất, tình trạng và giá cả.",
        "Tin đăng sẽ được admin duyệt trong vòng 1–2 giờ làm việc. Tin không đạt tiêu chuẩn sẽ bị từ chối kèm lý do.",
        "Không được đăng tin trùng lặp cho cùng một xe. Vi phạm sẽ bị ẩn tất cả tin đăng.",
      ] },
      { title: "3. Chính sách cho thuê xe", content: [
        "Người cho thuê chịu hoàn toàn trách nhiệm về tình trạng xe, giấy tờ pháp lý và bảo hiểm.",
        "Người thuê phải xuất trình bằng lái xe hợp lệ (hạng B2 trở lên) và giấy tờ tùy thân bản gốc.",
        "Tiền đặt cọc do hai bên tự thỏa thuận. Fast không can thiệp vào việc hoàn trả cọc.",
        "Mọi thiệt hại xảy ra trong thời gian thuê là trách nhiệm của người thuê nếu không có thỏa thuận khác bằng văn bản.",
      ] },
      { title: "4. Chính sách bảo mật", content: [
        "Fast thu thập thông tin cá nhân (tên, email, số điện thoại) phục vụ mục đích vận hành nền tảng.",
        "Chúng tôi không bán hoặc chia sẻ thông tin cá nhân với bên thứ ba vì mục đích thương mại.",
        "Dữ liệu được mã hóa và lưu trữ an toàn. Người dùng có quyền yêu cầu xóa tài khoản và toàn bộ dữ liệu bất kỳ lúc nào.",
        "Chúng tôi sử dụng cookie để cải thiện trải nghiệm người dùng. Bạn có thể tắt cookie trong cài đặt trình duyệt.",
      ] },
      { title: "5. Giải quyết tranh chấp", content: [
        "Fast hỗ trợ hòa giải trong các tranh chấp giữa người dùng nhưng không chịu trách nhiệm pháp lý cho kết quả giao dịch.",
        "Nếu phát hiện gian lận, vui lòng báo cáo ngay qua email hỗ trợ. Chúng tôi sẽ xử lý trong vòng 24–48 giờ làm việc.",
        "Các tranh chấp không giải quyết được sẽ được xử lý theo quy định pháp luật Việt Nam hiện hành.",
      ] },
      { title: "6. Thay đổi điều khoản", content: [
        "Fast có quyền cập nhật chính sách này bất kỳ lúc nào. Thay đổi sẽ được thông báo qua email hoặc thông báo trên nền tảng.",
        "Tiếp tục sử dụng dịch vụ sau khi chính sách cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi đó.",
      ] },
    ],
  },
  en: {
    title: "Policies",
    updated: "Last updated:",
    policies: [
      { title: "1. Terms of use", content: [
        "Fast is a platform connecting car buyers, sellers and renters. We are not a direct party to transactions between users.",
        "Users must be 18 or older and provide truthful information when registering an account.",
        "Posting false, fraudulent or deceptive information is strictly prohibited. Violations result in permanent account suspension.",
        "Fast reserves the right to remove any violating content without prior notice.",
      ] },
      { title: "2. Listing policy", content: [
        "Each account may post up to 5 listings within 24 hours to prevent spam.",
        "Listings must include real photos of the car and accurate details about year, condition and price.",
        "Listings are reviewed by admins within 1–2 business hours. Substandard listings are rejected with a reason.",
        "Duplicate listings for the same car are not allowed. Violations may hide all your listings.",
      ] },
      { title: "3. Car rental policy", content: [
        "The owner is fully responsible for the car's condition, legal documents and insurance.",
        "The renter must present a valid driver's license (class B2 or higher) and original ID.",
        "Deposits are agreed between the two parties. Fast does not intervene in deposit refunds.",
        "Any damage during the rental is the renter's responsibility unless otherwise agreed in writing.",
      ] },
      { title: "4. Privacy policy", content: [
        "Fast collects personal information (name, email, phone) to operate the platform.",
        "We do not sell or share personal information with third parties for commercial purposes.",
        "Data is encrypted and stored securely. Users may request account and data deletion at any time.",
        "We use cookies to improve the user experience. You can disable cookies in your browser settings.",
      ] },
      { title: "5. Dispute resolution", content: [
        "Fast helps mediate disputes between users but is not legally liable for transaction outcomes.",
        "If you detect fraud, report it immediately via support email. We will handle it within 24–48 business hours.",
        "Unresolved disputes will be handled under applicable Vietnamese law.",
      ] },
      { title: "6. Changes to terms", content: [
        "Fast may update this policy at any time. Changes will be announced via email or an on-platform notice.",
        "Continuing to use the service after an update means you accept those changes.",
      ] },
    ],
  },
};

export default function ChinhSachPage() {
  const t = CONTENT[getServerLocale()] ?? CONTENT.vi;
  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-2">
          {t.updated} {new Date().toLocaleDateString("vi-VN")}
        </p>
      </div>

      <div className="space-y-8">
        {t.policies.map((p, i) => (
          <div key={i} className="space-y-3">
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <ul className="space-y-2">
              {p.content.map((c, j) => (
                <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

import { MapPin, Mail, Phone, Clock, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.contact };
}

const CONTENT = {
  vi: {
    title: "Liên Hệ",
    subtitle: "Chúng tôi luôn sẵn sàng hỗ trợ bạn. Liên hệ qua các kênh bên dưới.",
    addressLabel: "Địa chỉ",
    address: ["123 Nguyễn Văn Linh, Quận 1", "Thành phố Hồ Chí Minh, Việt Nam"],
    emailLabel: "Email hỗ trợ",
    emailIntro: "Mọi thắc mắc vui lòng gửi về:",
    phoneLabel: "Liên hệ trực tiếp",
    phoneIntro: "Gọi hoặc nhắn tin Zalo:",
    hoursLabel: "Giờ làm việc",
    hours: ["Thứ Hai – Thứ Sáu: 8:00 – 17:30", "Thứ Bảy: 8:00 – 12:00", "Chủ Nhật & Lễ: Nghỉ"],
    reportTitle: "Báo cáo vi phạm",
    reportBodyPre: "Nếu bạn gặp tin đăng gian lận, người dùng lừa đảo hoặc nội dung vi phạm, hãy gửi email đến",
    reportBodyMid: "với tiêu đề",
    reportTag: "[BÁO CÁO VI PHẠM]",
    reportBodyPost: ". Chúng tôi sẽ xử lý trong vòng 24 giờ làm việc.",
  },
  en: {
    title: "Contact",
    subtitle: "We're always ready to help. Reach us through the channels below.",
    addressLabel: "Address",
    address: ["123 Nguyen Van Linh, District 1", "Ho Chi Minh City, Vietnam"],
    emailLabel: "Support email",
    emailIntro: "Please send any questions to:",
    phoneLabel: "Direct contact",
    phoneIntro: "Call or message on Zalo:",
    hoursLabel: "Working hours",
    hours: ["Monday – Friday: 8:00 – 17:30", "Saturday: 8:00 – 12:00", "Sunday & holidays: Closed"],
    reportTitle: "Report a violation",
    reportBodyPre: "If you encounter a fraudulent listing, a scammer, or violating content, email",
    reportBodyMid: "with the subject",
    reportTag: "[VIOLATION REPORT]",
    reportBodyPost: ". We'll handle it within 24 business hours.",
  },
};

export default function LienHePage() {
  const t = CONTENT[getServerLocale()] ?? CONTENT.vi;
  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground mt-2">{t.subtitle}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Địa chỉ */}
        <Card>
          <CardContent className="pt-6 flex gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t.addressLabel}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t.address[0]}<br />
                {t.address[1]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardContent className="pt-6 flex gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t.emailLabel}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.emailIntro}</p>
              <a
                href="mailto:abc@gmail.com"
                className="text-sm text-primary hover:underline font-medium"
              >
                abc@gmail.com
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Điện thoại */}
        <Card>
          <CardContent className="pt-6 flex gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t.phoneLabel}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.phoneIntro}</p>
              <a
                href="tel:+84123456789"
                className="text-sm text-primary hover:underline font-medium"
              >
                (+84) 123 456 789
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Giờ làm việc */}
        <Card>
          <CardContent className="pt-6 flex gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t.hoursLabel}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t.hours[0]}<br />
                {t.hours[1]}<br />
                {t.hours[2]}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      <div className="mt-8 rounded-xl border bg-muted/30 p-6 flex gap-4">
        <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">{t.reportTitle}</p>
          <p>
            {t.reportBodyPre}{" "}
            <a href="mailto:abc@gmail.com" className="text-primary hover:underline">abc@gmail.com</a>{" "}
            {t.reportBodyMid} <strong>{t.reportTag}</strong>{t.reportBodyPost}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/components/i18n/language-provider";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-gray-50 py-12">
      <div className="container grid gap-8 md:grid-cols-4">
        <div>
          <Link href="/" className="mb-4 inline-flex items-center" aria-label="Fast">
            <Image src="/logo.png" alt="Fast" width={148} height={36} className="h-8 w-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">{t.footer.tagline}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-3">{t.footer.services}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/mua-xe" className="hover:text-foreground">{t.common.buyCar}</Link></li>
            <li><Link href="/thue-xe" className="hover:text-foreground">{t.common.rentCar}</Link></li>
            <li><Link href="/dang-tin" className="hover:text-foreground">{t.footer.postSell}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">{t.footer.support}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/huong-dan" className="hover:text-foreground">{t.footer.guide}</Link></li>
            <li><Link href="/chinh-sach" className="hover:text-foreground">{t.footer.policy}</Link></li>
            <li><Link href="/lien-he" className="hover:text-foreground">{t.footer.contact}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-3">{t.footer.account}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/register" className="hover:text-foreground">{t.common.register}</Link></li>
            <li><Link href="/login" className="hover:text-foreground">{t.common.login}</Link></li>
          </ul>
        </div>
      </div>

      <div className="container mt-8 border-t pt-6">
        <p className="text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} Fast. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}

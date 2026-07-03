import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, Search, Shield, Star } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";

export default function HomePage() {
  const t = getServerDictionary().home;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white">
        <div className="container text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t.heroTitle}
            <br />
            <span className="text-blue-200">{t.heroHighlight}</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">{t.heroSubtitle}</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="bg-white text-blue-700 hover:bg-blue-50">
              <Link href="/mua-xe">{t.ctaBuyNow}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-blue-700">
              <Link href="/thue-xe">{t.ctaRent}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-blue-700">
              <Link href="/dang-tin">{t.ctaPost}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold">{t.whyTitle}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t.feat1Title}</h3>
              <p className="text-muted-foreground">{t.feat1Desc}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Search className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t.feat2Title}</h3>
              <p className="text-muted-foreground">{t.feat2Desc}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t.feat3Title}</h3>
              <p className="text-muted-foreground">{t.feat3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for Sellers */}
      <section className="bg-gray-50 py-16">
        <div className="container">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Car className="h-6 w-6 text-blue-600" />
                <span className="font-semibold text-blue-600">{t.sellerBadge}</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold">{t.sellerTitle}</h2>
              <p className="max-w-md text-muted-foreground">{t.sellerDesc}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" asChild>
                <Link href="/register">{t.sellerRegister}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dang-tin">{t.sellerPost}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

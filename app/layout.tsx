import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const m = getServerDictionary().meta;
  return {
    title: {
      default: m.home,
      template: "%s | Fast",
    },
    description: m.desc,
    keywords: m.keywords,
    openGraph: {
      type: "website",
      locale: m.ogLocale,
      url: process.env.NEXT_PUBLIC_APP_URL,
      siteName: "Fast",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getServerLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <LanguageProvider locale={locale}>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}

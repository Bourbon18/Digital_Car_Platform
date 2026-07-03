"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Menu, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/search/search-bar";
import { NotificationBell } from "@/components/notification-bell";
import { MessageBell } from "@/components/message-bell";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";

export function Header() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [isSuspended, setIsSuspended] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/status")
      .then((r) => r.json())
      .then((d) => setIsSuspended(d.status === "suspended"))
      .catch(() => {});
  }, [session?.user?.id]);

  // Hiệu ứng liquid glass: khi cuộn xuống, header thành kính mờ trong suốt
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ease-out ${
        scrolled
          ? "border-b border-white/30 bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/25"
          : "border-b border-transparent bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      }`}
    >
      <div className="container flex h-16 items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0" aria-label="Fast">
          <Image
            src="/logo.png"
            alt="Fast"
            width={82}
            height={20}
            priority
            className="h-5 w-auto"
          />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-4">
          <Link href="/mua-xe" className="text-muted-foreground hover:text-foreground transition-colors">
            {t.common.buyCar}
          </Link>
          <Link href="/thue-xe" className="text-muted-foreground hover:text-foreground transition-colors">
            {t.common.rentCar}
          </Link>
          {session?.user?.role !== "buyer" && (
            <Link href="/dang-tin" className="text-muted-foreground hover:text-foreground transition-colors">
              {t.common.postListing}
            </Link>
          )}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-2 ml-auto">
          {session ? (
            <>
              <MessageBell />
              <NotificationBell initialCount={0} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user?.name || session.user?.email}</p>
                    {isSuspended && (
                      <span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        🔒 {t.header.accountSuspended}
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t.common.dashboard}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      {t.common.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.common.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">{t.common.login}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t.common.register}</Link>
              </Button>
            </>
          )}

          <LanguageSwitcher />

          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

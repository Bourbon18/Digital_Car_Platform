import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile-form";
import { PaymentQrForm } from "@/components/profile/payment-qr-form";
import { BusinessPaymentChannels } from "@/components/profile/business-payment-channels";
import { DeleteAccountForm } from "@/components/profile/delete-account-form";
import { ChangeEmailForm } from "@/components/change-email-form";
import { getEffectivePlan } from "@/lib/subscription";
import { getServerDictionary } from "@/lib/i18n/server";
import { ShieldCheck, CalendarDays, Phone, Mail } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.profile };
}

const ROLE_COLORS: Record<string, string> = {
  buyer: "bg-blue-100 text-blue-700 border-blue-200",
  individual_seller: "bg-green-100 text-green-700 border-green-200",
  individual_renter: "bg-purple-100 text-purple-700 border-purple-200",
  dealer: "bg-orange-100 text-orange-700 border-orange-200",
  admin: "bg-red-100 text-red-700 border-red-200",
};

const SELLER_ROLES = ["individual_seller", "individual_renter", "dealer"];

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      emailVerified: true, emailChangedAt: true,
      paymentQrUrl: true, bankAccountInfo: true,
      plan: true, planExpiresAt: true,
      createdAt: true, dealerProfile: true,
    },
  });
  if (!user) redirect("/login");

  const isSellerRole = SELLER_ROLES.includes(user.role);
  const effectivePlan = getEffectivePlan(user);
  const maxExtraQr = Math.max(0, effectivePlan.maxPaymentQr - 1);
  const extraChannels = isSellerRole
    ? await db.paymentQr.findMany({
        where: { userId: user.id },
        select: { id: true, qrUrl: true, bankInfo: true, label: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const initials = (user.name || user.email)
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const P = getServerDictionary().profile;
  const roleColor = ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-700 border-gray-200";
  const roleNames: Record<string, string> = {
    buyer: P.roleBuyer, individual_seller: P.roleSeller, individual_renter: P.roleRenter,
    dealer: P.roleDealer, admin: P.roleAdmin,
  };
  const roleName = roleNames[user.role] ?? user.role;
  const isSeller = SELLER_ROLES.includes(user.role);

  return (
    <div className="w-full space-y-0">
      {/* Banner header */}
      <div className="relative w-full rounded-2xl overflow-hidden mb-8">
        {/* Gradient background */}
        <div className="h-36 bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />

        {/* Profile info row */}
        <div className="bg-card border-x border-b rounded-b-2xl px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-white border-4 border-card shadow-md flex items-center justify-center text-primary text-2xl font-bold select-none">
              {initials}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{user.name || P.noName}</h1>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColor}`}>
                  {roleName}
                </span>
                {user.emailVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <ShieldCheck className="h-3 w-3" />
                    {P.verified}
                  </span>
                )}
              </div>

              {/* Quick info */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {user.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {P.memberSince} {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung — mỗi cột tự xếp chồng để không bị khoảng trống lệch */}
      {isSeller ? (
        <div className="grid gap-6 items-start grid-cols-1 lg:grid-cols-2">
          {/* Cột trái: hồ sơ + đổi email */}
          <div className="space-y-6">
            <ProfileForm user={user} />
            <ChangeEmailForm currentEmail={user.email} emailChangedAt={user.emailChangedAt} />
          </div>

          {/* Cột phải: thanh toán + xóa tài khoản */}
          <div className="space-y-6">
            <PaymentQrForm
              currentQrUrl={user.paymentQrUrl}
              currentBankInfo={user.bankAccountInfo}
            />
            <BusinessPaymentChannels
              planName={effectivePlan.name}
              maxExtra={maxExtraQr}
              planExpiresAt={user.planExpiresAt ? user.planExpiresAt.toISOString() : null}
              initialChannels={extraChannels}
            />
            <DeleteAccountForm email={user.email} />
          </div>
        </div>
      ) : (
        <div className="max-w-xl space-y-6">
          <ProfileForm user={user} />
          <ChangeEmailForm currentEmail={user.email} emailChangedAt={user.emailChangedAt} />
          <DeleteAccountForm email={user.email} />
        </div>
      )}
    </div>
  );
}

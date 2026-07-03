import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerDictionary } from "@/lib/i18n/server";

export default function PaymentSuccessPage() {
  const c = getServerDictionary().checkout;
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{c.successTitle}</h1>
        <p className="text-muted-foreground mb-6">{c.successDesc}</p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard/bookings">{c.viewBooking}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{c.backHome}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, List, Calendar, Heart, MessageSquare, Settings, Crown } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, name } = session.user;
  const t = getServerDictionary().dashboard;

  const isSellerOrDealer = ["individual_seller", "individual_renter", "dealer"].includes(role);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.greeting}, {name || t.you}!</h1>
        <p className="text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isSellerOrDealer && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <List className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t.myListings}</CardTitle>
              </div>
              <CardDescription>{t.myListingsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/listings">{t.viewListings}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t.bookingHistory}</CardTitle>
            </div>
            <CardDescription>{t.bookingHistoryDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/bookings">{t.viewBookings}</Link>
            </Button>
          </CardContent>
        </Card>

        {isSellerOrDealer && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t.manageRentals}</CardTitle>
              </div>
              <CardDescription>{t.manageRentalsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/rentals">{t.viewRentals}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isSellerOrDealer && (
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t.subscription}</CardTitle>
              </div>
              <CardDescription>{t.subscriptionDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/subscription">{t.viewPlans}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t.savedCars}</CardTitle>
            </div>
            <CardDescription>{t.savedCarsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/saved">{t.viewSaved}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t.messages}</CardTitle>
            </div>
            <CardDescription>{t.messagesDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/messages">{t.viewMessages}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t.settings}</CardTitle>
            </div>
            <CardDescription>{t.settingsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/profile">{t.viewProfile}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

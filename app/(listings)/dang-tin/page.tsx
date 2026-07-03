import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CreateListingForm } from "@/components/listing/create-listing-form";
import { getServerDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const m = getServerDictionary().meta;
  return { title: m.postTitle, description: m.postDesc };
}

export default async function CreateListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dang-tin");
  const C = getServerDictionary().create;

  const { role } = session.user;
  const canCreate = ["individual_seller", "individual_renter", "dealer"].includes(role);

  if (!canCreate) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{C.noPermTitle}</h1>
        <p className="text-muted-foreground">
          {C.noPermDesc}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{C.pageTitle}</h1>
      <CreateListingForm />
    </div>
  );
}

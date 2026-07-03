import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { ChatShell } from "@/components/messages/chat-shell";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.messages };
}

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <ChatShell currentUserId={session.user.id} />;
}

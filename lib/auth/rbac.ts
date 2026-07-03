import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  // Check live status from DB to catch users suspended after login
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });
  if (!dbUser || dbUser.status === "suspended") {
    throw new Error("SUSPENDED");
  }

  return session.user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireEmailVerified() {
  const user = await requireAuth();
  if (!user.emailVerified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }
  return user;
}

export function canCreateListing(role: UserRole): boolean {
  return ["individual_seller", "individual_renter", "dealer"].includes(role);
}

export function canManageListings(role: UserRole): boolean {
  return ["individual_seller", "individual_renter", "dealer", "admin"].includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

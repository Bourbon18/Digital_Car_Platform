import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatMessageTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return isToday ? time : `${d.toLocaleDateString("vi-VN")} ${time}`;
}

export function generateSlug(text: string, id?: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return id ? `${slug}-${id.slice(0, 8)}` : slug;
}

export function calculateRentalPrice(
  pricePerDay: number,
  startDate: Date,
  endDate: Date,
  weeklyDiscountEnabled: boolean = false
): { totalDays: number; totalPrice: number; discountApplied: boolean; savedAmount: number } {
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
  const basePrice = pricePerDay * totalDays;

  if (weeklyDiscountEnabled && totalDays >= 7) {
    const discountedPrice = basePrice * 0.9;
    return {
      totalDays,
      totalPrice: discountedPrice,
      discountApplied: true,
      savedAmount: basePrice - discountedPrice,
    };
  }

  return { totalDays, totalPrice: basePrice, discountApplied: false, savedAmount: 0 };
}

export function calculateRefundAmount(
  depositAmount: number,
  startDate: Date
): { refundAmount: number; refundPercent: number } {
  const now = new Date();
  const hoursUntilPickup = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilPickup > 48) {
    return { refundAmount: depositAmount, refundPercent: 100 };
  } else if (hoursUntilPickup > 24) {
    return { refundAmount: depositAmount * 0.7, refundPercent: 70 };
  } else {
    return { refundAmount: 0, refundPercent: 0 };
  }
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}

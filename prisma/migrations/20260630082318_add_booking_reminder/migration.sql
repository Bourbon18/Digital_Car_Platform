-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'booking_reminder';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "returnReminderSent" BOOLEAN NOT NULL DEFAULT false;

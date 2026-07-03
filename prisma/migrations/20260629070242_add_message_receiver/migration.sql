-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "receiverId" TEXT;

-- CreateIndex
CREATE INDEX "ContactMessage_receiverId_idx" ON "ContactMessage"("receiverId");

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

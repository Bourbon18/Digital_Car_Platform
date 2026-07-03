-- CreateTable
CREATE TABLE "PaymentQr" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qrUrl" TEXT NOT NULL,
    "bankInfo" TEXT,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentQr_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentQr_userId_idx" ON "PaymentQr"("userId");

-- AddForeignKey
ALTER TABLE "PaymentQr" ADD CONSTRAINT "PaymentQr_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

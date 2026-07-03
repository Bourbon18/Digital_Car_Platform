-- CreateTable
CREATE TABLE "FeaturedBoost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedBoost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeaturedBoost_userId_createdAt_idx" ON "FeaturedBoost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeaturedBoost_listingId_idx" ON "FeaturedBoost"("listingId");

-- AddForeignKey
ALTER TABLE "FeaturedBoost" ADD CONSTRAINT "FeaturedBoost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedBoost" ADD CONSTRAINT "FeaturedBoost_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'trial',
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3);

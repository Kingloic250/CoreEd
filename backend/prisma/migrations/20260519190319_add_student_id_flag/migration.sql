-- AlterTable
ALTER TABLE "account_requests" ADD COLUMN     "flagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studentId" TEXT;

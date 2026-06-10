ALTER TABLE "lecturers" ADD COLUMN "invitationToken" TEXT UNIQUE;
ALTER TABLE "lecturers" ADD COLUMN "invitationTokenExpires" TIMESTAMP(3);
ALTER TABLE "lecturers" ADD COLUMN "invitationAcceptedAt" TIMESTAMP(3);
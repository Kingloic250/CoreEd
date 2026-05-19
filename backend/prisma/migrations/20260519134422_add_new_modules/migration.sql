-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'submitted', 'graded', 'overdue');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('exam', 'deadline', 'holiday', 'event');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('slide', 'syllabus', 'reading');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('bank_transfer', 'mobile_money', 'credit_card', 'cash');

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "courseName" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TEXT,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT,
    "studentId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "content" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL,
    "date" TEXT,
    "time" TEXT,
    "endTime" TEXT,
    "courseId" TEXT,
    "courseName" TEXT,
    "targetRoles" JSONB NOT NULL DEFAULT '[]',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "courseId" TEXT,
    "courseName" TEXT,
    "fileName" TEXT,
    "description" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_appeals" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT,
    "studentId" TEXT,
    "subject" TEXT,
    "semester" TEXT,
    "claimedGrade" TEXT,
    "reason" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNote" TEXT,

    CONSTRAINT "grade_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "dueDate" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "semester" TEXT,
    "academicYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3),
    "receivedBy" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT,
    "senderRole" TEXT,
    "recipientId" TEXT,
    "recipientName" TEXT,
    "recipientRole" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_assignments_course" ON "assignments"("courseId");

-- CreateIndex
CREATE INDEX "idx_submissions_assignment" ON "assignment_submissions"("assignmentId");

-- CreateIndex
CREATE INDEX "idx_submissions_student" ON "assignment_submissions"("studentId");

-- CreateIndex
CREATE INDEX "idx_events_type" ON "calendar_events"("type");

-- CreateIndex
CREATE INDEX "idx_events_date" ON "calendar_events"("date");

-- CreateIndex
CREATE INDEX "idx_materials_course" ON "course_materials"("courseId");

-- CreateIndex
CREATE INDEX "idx_materials_type" ON "course_materials"("type");

-- CreateIndex
CREATE INDEX "idx_claims_student" ON "grade_appeals"("studentId");

-- CreateIndex
CREATE INDEX "idx_claims_status" ON "grade_appeals"("status");

-- CreateIndex
CREATE INDEX "idx_invoices_student" ON "invoices"("studentId");

-- CreateIndex
CREATE INDEX "idx_invoices_status" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "idx_invoice_items_invoice" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_payments_invoice" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_messages_sender" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "idx_messages_recipient" ON "messages"("recipientId");

-- CreateIndex
CREATE INDEX "idx_messages_parent" ON "messages"("parentId");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_appeals" ADD CONSTRAINT "grade_appeals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

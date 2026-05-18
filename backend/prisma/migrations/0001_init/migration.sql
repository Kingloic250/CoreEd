-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'lecturer', 'student');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('active', 'inactive', 'graduated', 'expelled');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TEXT,
    "gender" "Gender",
    "year" TEXT NOT NULL,
    "enrollmentDate" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'active',
    "studentNumber" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturers" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "assignedCourses" JSONB NOT NULL DEFAULT '[]',
    "qualification" TEXT,
    "joinDate" TEXT,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "headLecturerId" TEXT,
    "description" TEXT,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" TEXT,
    "department" TEXT,
    "lecturerId" TEXT,
    "semesterId" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "room" TEXT,
    "schedule" JSONB NOT NULL DEFAULT '[]',
    "studentIds" JSONB NOT NULL DEFAULT '[]',
    "gradingComponents" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "studentId" TEXT,
    "date" TEXT,
    "status" "AttendanceStatus",
    "markedBy" TEXT,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "courseId" TEXT,
    "semester" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "grade" TEXT,
    "comments" TEXT,
    "componentScores" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "targetRoles" JSONB NOT NULL DEFAULT '[]',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" TEXT NOT NULL DEFAULT 'normal',

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "classOrSubject" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "schoolEmail" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "account_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT,
    "performedBy" TEXT,
    "performedById" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentNumber_key" ON "students"("studentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_email_key" ON "lecturers"("email");

-- CreateIndex
CREATE INDEX "idx_attendance_course" ON "attendance"("courseId");

-- CreateIndex
CREATE INDEX "idx_attendance_student" ON "attendance"("studentId");

-- CreateIndex
CREATE INDEX "idx_grades_student" ON "grades"("studentId");

-- CreateIndex
CREATE INDEX "idx_grades_course" ON "grades"("courseId");

-- CreateIndex
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs"("timestamp" DESC);

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_requests" ADD CONSTRAINT "account_requests_schoolEmail_fkey" FOREIGN KEY ("schoolEmail") REFERENCES "users"("email") ON DELETE SET NULL ON UPDATE CASCADE;

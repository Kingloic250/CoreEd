CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'lecturer', 'student')),
  avatar TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(20) PRIMARY KEY,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  "dateOfBirth" VARCHAR(20),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  year VARCHAR(20) NOT NULL,
  "enrollmentDate" VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'expelled'))
);

CREATE TABLE IF NOT EXISTS lecturers (
  id VARCHAR(20) PRIMARY KEY,
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(255),
  "assignedCourses" JSONB DEFAULT '[]'::jsonb,
  qualification VARCHAR(255),
  "joinDate" VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20),
  "headLecturerId" VARCHAR(20),
  description TEXT
);

CREATE TABLE IF NOT EXISTS semesters (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  year VARCHAR(20),
  "startDate" VARCHAR(20),
  "endDate" VARCHAR(20),
  "isActive" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  year VARCHAR(20),
  department VARCHAR(20),
  "lecturerId" VARCHAR(20),
  "semesterId" VARCHAR(20),
  credits INTEGER DEFAULT 3,
  room VARCHAR(100),
  schedule JSONB DEFAULT '[]'::jsonb,
  "studentIds" JSONB DEFAULT '[]'::jsonb,
  "gradingComponents" JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(20) PRIMARY KEY,
  "courseId" VARCHAR(20),
  "studentId" VARCHAR(20),
  date VARCHAR(20),
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')),
  "markedBy" VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(20) PRIMARY KEY,
  "studentId" VARCHAR(20),
  "courseId" VARCHAR(20),
  semester VARCHAR(50),
  score REAL DEFAULT 0,
  "maxScore" REAL DEFAULT 100,
  grade VARCHAR(5),
  comments TEXT,
  "componentScores" JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(20) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  "targetRoles" JSONB DEFAULT '[]'::jsonb,
  "createdBy" VARCHAR(20),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  priority VARCHAR(20) DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS account_requests (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  "classOrSubject" VARCHAR(255),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  "schoolEmail" VARCHAR(255),
  password VARCHAR(255),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "approvedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(20) PRIMARY KEY,
  action VARCHAR(100),
  "performedBy" VARCHAR(255),
  "performedById" VARCHAR(20),
  "targetType" VARCHAR(50),
  "targetId" VARCHAR(20),
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance("courseId");
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance("studentId");
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades("studentId");
CREATE INDEX IF NOT EXISTS idx_grades_course ON grades("courseId");

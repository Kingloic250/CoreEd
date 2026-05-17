import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const studentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  dateOfBirth: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return date < now && age >= 17 && age <= 60;
    }, 'Date of birth must be valid (age 17–60)'),
  gender: z.enum(['male', 'female'] as const, { error: 'Gender is required' }),
  year: z.string().min(1, 'Year is required'),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const lecturerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().min(1, 'Department is required'),
  assignedCourses: z.array(z.string()).default([]),
  qualification: z.string().min(2, 'Qualification is required'),
  joinDate: z.string().min(1, 'Join date is required'),
});

export const courseSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  year: z.string().min(1, 'Year is required'),
  department: z.string().min(1, 'Department is required'),
  lecturerId: z.string().min(1, 'Lecturer is required'),
  room: z.string().min(1, 'Room is required'),
  schedule: z
    .array(
      z.object({
        day: z.string().min(1, 'Day is required'),
        startTime: z.string().min(1, 'Start time is required'),
        endTime: z.string().min(1, 'End time is required'),
      })
    )
    .min(1, 'At least one schedule slot is required'),
});

export const gradeSchema = z.object({
  score: z
    .number({ error: 'Score must be a number' })
    .min(0, 'Score must be at least 0')
    .max(100, 'Score cannot exceed 100'),
  comments: z.string().max(200, 'Comments cannot exceed 200 characters').optional(),
});

export const attendanceEntrySchema = z.object({
  studentId: z.string(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(100, 'Notes cannot exceed 100 characters').optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type StudentFormData = z.infer<typeof studentSchema>;
export type LecturerFormData = z.infer<typeof lecturerSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type GradeFormData = z.infer<typeof gradeSchema>;

// Shared Zod validation schemas used across all form components
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
      return date < now && age >= 5 && age <= 25;
    }, 'Date of birth must be valid (age 5–25)'),
  gender: z.enum(['male', 'female'] as const, { error: 'Gender is required' }),
  class: z.string().min(1, 'Class is required'),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianPhone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const teacherSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Subject is required'),
  assignedClasses: z.array(z.string()).default([]),
  qualification: z.string().min(2, 'Qualification is required'),
  joinDate: z.string().min(1, 'Join date is required'),
});

export const classSchema = z.object({
  name: z.string().min(2, 'Class name must be at least 2 characters'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
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
export type TeacherFormData = z.infer<typeof teacherSchema>;
export type ClassFormData = z.infer<typeof classSchema>;
export type GradeFormData = z.infer<typeof gradeSchema>;

// Date, grade, percentage, and name formatters
import { format, parseISO } from 'date-fns';
import { GRADE_SCALE } from './constants';

export const formatDate = (dateString: string, fmt = 'MMM d, yyyy'): string => {
  try {
    return format(parseISO(dateString), fmt);
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string =>
  formatDate(dateString, 'MMM d, yyyy HH:mm');

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getLetterGrade = (score: number): string => {
  const scale = GRADE_SCALE.find((g) => score >= g.min && score <= g.max);
  return scale?.letter ?? 'F';
};

export const getGradeColor = (scoreOrLetter: number | string): string => {
  if (typeof scoreOrLetter === 'string') {
    const scale = GRADE_SCALE.find((g) => g.letter === scoreOrLetter);
    return scale?.color ?? 'text-destructive';
  }
  const scale = GRADE_SCALE.find((g) => scoreOrLetter >= g.min && scoreOrLetter <= g.max);
  return scale?.color ?? 'text-destructive';
};

export const formatPercentage = (value: number, decimals = 1): string =>
  `${value.toFixed(decimals)}%`;

export const getFullName = (firstName: string, lastName: string): string =>
  `${firstName} ${lastName}`;

export const attendanceStatusColor: Record<string, string> = {
  present: 'text-emerald-600 bg-emerald-50',
  absent: 'text-destructive bg-red-50',
  late: 'text-yellow-600 bg-yellow-50',
  excused: 'text-blue-600 bg-blue-50',
};

export const attendanceStatusBadge: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  excused: 'bg-blue-100 text-blue-700',
};

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { studentSchema, type StudentFormData } from '@/utils/validators';
import { YEARS } from '@/utils/constants';

interface StudentFormProps {
  defaultValues?: Partial<StudentFormData & { id: string }>;
  onSubmit: (data: StudentFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function StudentForm({ defaultValues, onSubmit, isLoading, onCancel }: StudentFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema) as never,
    defaultValues: defaultValues ?? { status: 'active' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" aria-label="First name">First Name</Label>
          <Input id="firstName" aria-invalid={!!errors.firstName} {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" aria-label="Last name">Last Name</Label>
          <Input id="lastName" aria-invalid={!!errors.lastName} {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" aria-label="Email address">Email</Label>
        <Input id="email" type="email" aria-invalid={!!errors.email} {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth" aria-label="Date of birth">Date of Birth</Label>
          <Input id="dateOfBirth" type="date" aria-invalid={!!errors.dateOfBirth} {...register('dateOfBirth')} />
          {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender" aria-label="Gender">Gender</Label>
          <Select onValueChange={(v) => setValue('gender', v as 'male' | 'female')} defaultValue={defaultValues?.gender}>
            <SelectTrigger id="gender" aria-invalid={!!errors.gender} aria-label="Select gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="year" aria-label="Year">Year</Label>
        <Select onValueChange={(v) => setValue('year', v)} defaultValue={defaultValues?.year}>
          <SelectTrigger id="year" aria-invalid={!!errors.year} aria-label="Select year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="enrollmentDate" aria-label="Enrollment date">Enrollment Date</Label>
          <Input id="enrollmentDate" type="date" aria-invalid={!!errors.enrollmentDate} {...register('enrollmentDate')} />
          {errors.enrollmentDate && <p className="text-xs text-destructive">{errors.enrollmentDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(v) => setValue('status', v as 'active' | 'inactive')} defaultValue={defaultValues?.status ?? 'active'}>
            <SelectTrigger id="status" aria-invalid={!!errors.status}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
              <SelectItem value="expelled">Expelled</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Spinner className="size-4" />}
          {defaultValues?.id ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}

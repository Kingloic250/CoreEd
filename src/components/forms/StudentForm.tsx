// Add/edit student form with React Hook Form + Zod validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { studentSchema, type StudentFormData } from '@/utils/validators';
import { GRADE_LEVELS } from '@/utils/constants';

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
        <Label htmlFor="class" aria-label="Class">Class</Label>
        <Select onValueChange={(v) => setValue('class', v)} defaultValue={defaultValues?.class}>
          <SelectTrigger id="class" aria-invalid={!!errors.class} aria-label="Select class">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.class && <p className="text-xs text-destructive">{errors.class.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="guardianName" aria-label="Guardian name">Guardian Name</Label>
          <Input id="guardianName" aria-invalid={!!errors.guardianName} {...register('guardianName')} />
          {errors.guardianName && <p className="text-xs text-destructive">{errors.guardianName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guardianPhone" aria-label="Guardian phone">Guardian Phone</Label>
          <Input id="guardianPhone" aria-invalid={!!errors.guardianPhone} {...register('guardianPhone')} />
          {errors.guardianPhone && <p className="text-xs text-destructive">{errors.guardianPhone.message}</p>}
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

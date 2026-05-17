// Add/edit teacher form with React Hook Form + Zod validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { teacherSchema, type TeacherFormData } from '@/utils/validators';
import { SUBJECTS } from '@/utils/constants';

interface TeacherFormProps {
  defaultValues?: Partial<TeacherFormData & { id: string }>;
  onSubmit: (data: TeacherFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function TeacherForm({ defaultValues, onSubmit, isLoading, onCancel }: TeacherFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema) as never,
    defaultValues: defaultValues ?? {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tf-firstName" aria-label="First name">First Name</Label>
          <Input id="tf-firstName" aria-invalid={!!errors.firstName} {...register('firstName')} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tf-lastName" aria-label="Last name">Last Name</Label>
          <Input id="tf-lastName" aria-invalid={!!errors.lastName} {...register('lastName')} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-email" aria-label="Email address">Email</Label>
        <Input id="tf-email" type="email" aria-invalid={!!errors.email} {...register('email')} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-subject" aria-label="Subject">Subject</Label>
        <Select onValueChange={(v) => setValue('subject', v)} defaultValue={defaultValues?.subject}>
          <SelectTrigger id="tf-subject" aria-label="Select subject" aria-invalid={!!errors.subject}>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-qualification" aria-label="Qualification">Qualification</Label>
        <Input id="tf-qualification" aria-invalid={!!errors.qualification} {...register('qualification')} />
        {errors.qualification && <p className="text-xs text-destructive">{errors.qualification.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-joinDate" aria-label="Join date">Join Date</Label>
        <Input id="tf-joinDate" type="date" aria-invalid={!!errors.joinDate} {...register('joinDate')} />
        {errors.joinDate && <p className="text-xs text-destructive">{errors.joinDate.message}</p>}
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Spinner className="size-4" />}
          {defaultValues?.id ? 'Update Teacher' : 'Add Teacher'}
        </Button>
      </div>
    </form>
  );
}

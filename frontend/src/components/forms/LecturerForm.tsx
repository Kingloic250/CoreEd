import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { lecturerSchema, type LecturerFormData } from '@/utils/validators';

interface LecturerFormProps {
  defaultValues?: Partial<LecturerFormData & { id: string }>;
  onSubmit: (data: LecturerFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
  departments: { id: string; name: string }[];
}

export function LecturerForm({ defaultValues, onSubmit, isLoading, onCancel, departments }: LecturerFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<LecturerFormData>({
    resolver: zodResolver(lecturerSchema) as never,
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
        <Label htmlFor="tf-password" aria-label="Password">Password</Label>
        <div className="relative">
          <Input
            id="tf-password"
            type={showPassword ? 'text' : 'password'}
            aria-invalid={!!errors.password}
            {...register('password')}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-department" aria-label="Department">Department</Label>
        <Select onValueChange={(v) => setValue('department', v)} defaultValue={defaultValues?.department}>
          <SelectTrigger id="tf-department" aria-label="Select department" aria-invalid={!!errors.department}>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
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
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading && <Spinner className="size-4" />}
          {defaultValues?.id ? 'Update Lecturer' : 'Add Lecturer'}
        </Button>
      </div>
    </form>
  );
}

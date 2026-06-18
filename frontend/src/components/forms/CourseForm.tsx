import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { courseSchema, type CourseFormData } from '@/utils/validators';
import { YEARS } from '@/utils/constants';

interface FacultyOption {
  id: string;
  name: string;
  department?: { id: string; name: string } | null;
}

interface RoomOption {
  id: string;
  name: string;
  code: string | null;
}

interface CourseFormProps {
  defaultValues?: Partial<CourseFormData & { id: string }>;
  lecturers: Record<string, unknown>[];
  faculties: FacultyOption[];
  rooms: RoomOption[];
  onSubmit: (data: CourseFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function CourseForm({ defaultValues, lecturers, faculties, rooms, onSubmit, isLoading, onCancel }: CourseFormProps) {
  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="cf-name" aria-label="Course name">Course Name</Label>
        <Input id="cf-name" aria-invalid={!!errors.name} {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cf-year" aria-label="Year">Year</Label>
          <Select onValueChange={(v) => setValue('year', v)} defaultValue={defaultValues?.year}>
            <SelectTrigger id="cf-year" aria-label="Select year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-credits" aria-label="Credits">Credits</Label>
          <Input id="cf-credits" type="number" min={1} max={20} aria-invalid={!!errors.credits} {...register('credits', { valueAsNumber: true })} placeholder="e.g. 3" />
          {errors.credits && <p className="text-xs text-destructive">{errors.credits.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-max-students" aria-label="Max Students">Max Students (optional, course-level cap)</Label>
        <Input id="cf-max-students" type="number" min={1} aria-invalid={!!errors.maxStudents} {...register('maxStudents', { valueAsNumber: true })} placeholder="e.g. 90" />
        {errors.maxStudents && <p className="text-xs text-destructive">{errors.maxStudents.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-room" aria-label="Room">Room (optional)</Label>
          <Select onValueChange={(v) => setValue('roomId', v === 'none' ? '' : v)} defaultValue={defaultValues?.roomId || 'none'}>
          <SelectTrigger id="cf-room" className="w-full" aria-label="Select room">
            <SelectValue placeholder="No room selected" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No room</SelectItem>
            {rooms.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}{r.code ? ` (${r.code})` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cf-faculty" aria-label="Faculty">Faculty</Label>
          <Select onValueChange={(v) => setValue('facultyId', v)} defaultValue={defaultValues?.facultyId}>
            <SelectTrigger id="cf-faculty" className="w-full" aria-label="Select faculty">
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
              {faculties.map((f) => (
                <SelectItem key={f.id} value={f.id} className="truncate">
                  {f.department ? `${f.department.name} → ${f.name}` : f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.facultyId && <p className="text-xs text-destructive">{errors.facultyId.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-lecturer" aria-label="Lecturer">Lecturer</Label>
          <Select onValueChange={(v) => setValue('lecturerId', v)} defaultValue={defaultValues?.lecturerId}>
            <SelectTrigger id="cf-lecturer" aria-label="Select lecturer">
              <SelectValue placeholder="Select lecturer" />
            </SelectTrigger>
            <SelectContent>
              {lecturers.map((t) => (
                <SelectItem key={String(t.id)} value={String(t.id)}>
                  {String(t.firstName)} {String(t.lastName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.lecturerId && <p className="text-xs text-destructive">{errors.lecturerId.message}</p>}
        </div>
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading && <Spinner className="size-4" />}
          {defaultValues?.id ? 'Update Course' : 'Add Course'}
        </Button>
      </div>
    </form>
  );
}
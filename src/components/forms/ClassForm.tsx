// Add/edit class form with schedule builder
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { classSchema, type ClassFormData } from '@/utils/validators';
import { GRADE_LEVELS } from '@/utils/constants';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface ClassFormProps {
  defaultValues?: Partial<ClassFormData & { id: string }>;
  teachers: Record<string, unknown>[];
  onSubmit: (data: ClassFormData) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function ClassForm({ defaultValues, teachers, onSubmit, isLoading, onCancel }: ClassFormProps) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: defaultValues ?? { schedule: [{ day: '', startTime: '', endTime: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'schedule' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="cf-name" aria-label="Class name">Class Name</Label>
        <Input id="cf-name" aria-invalid={!!errors.name} {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="cf-grade" aria-label="Grade level">Grade Level</Label>
          <Select onValueChange={(v) => setValue('gradeLevel', v)} defaultValue={defaultValues?.gradeLevel}>
            <SelectTrigger id="cf-grade" aria-label="Select grade">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.gradeLevel && <p className="text-xs text-destructive">{errors.gradeLevel.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-room" aria-label="Room">Room</Label>
          <Input id="cf-room" aria-invalid={!!errors.room} {...register('room')} />
          {errors.room && <p className="text-xs text-destructive">{errors.room.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-teacher" aria-label="Teacher">Teacher</Label>
        <Select onValueChange={(v) => setValue('teacherId', v)} defaultValue={defaultValues?.teacherId}>
          <SelectTrigger id="cf-teacher" aria-label="Select teacher">
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={String(t.id)} value={String(t.id)}>
                {String(t.firstName)} {String(t.lastName)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.teacherId && <p className="text-xs text-destructive">{errors.teacherId.message}</p>}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Schedule</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ day: '', startTime: '', endTime: '' })}>
            <Plus className="size-3.5" /> Add Slot
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-3 gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Day</Label>
              <Select onValueChange={(v) => setValue(`schedule.${index}.day`, v)}>
                <SelectTrigger className="h-8 text-xs" aria-label="Select day">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Start</Label>
              <Input type="time" className="h-8 text-xs" {...register(`schedule.${index}.startTime`)} />
            </div>
            <div className="flex gap-1 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">End</Label>
                <Input type="time" className="h-8 text-xs" {...register(`schedule.${index}.endTime`)} />
              </div>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)} className="mb-0.5">
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Spinner className="size-4" />}
          {defaultValues?.id ? 'Update Class' : 'Add Class'}
        </Button>
      </div>
    </form>
  );
}

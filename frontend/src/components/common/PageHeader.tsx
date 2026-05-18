// Page title, optional description, and action button
import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
}

export function PageHeader({ title, description, actionLabel, actionIcon: ActionIcon, onAction }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-0.5 sm:mt-1 text-sm text-muted-foreground break-words">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="shrink-0 self-start w-full sm:w-auto">
          {ActionIcon && <ActionIcon className="size-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

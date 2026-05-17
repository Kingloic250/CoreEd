// Empty data placeholder component
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export function EmptyState({ message = 'No data', description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-3">
        <Inbox className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
    </div>
  );
}

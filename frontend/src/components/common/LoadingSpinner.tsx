// Centered loading indicator
import { Spinner } from '@/components/ui/spinner';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-label={message}>
      <Spinner className="size-8 text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

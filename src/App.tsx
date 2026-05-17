import { Toaster } from 'sonner';
import { AppRouter } from '@/routes/AppRouter';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
      <Toaster richColors closeButton position="top-right" />
    </ErrorBoundary>
  );
}

export default App;

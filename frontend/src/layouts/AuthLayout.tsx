import { Outlet } from 'react-router-dom';
import { PageTransition } from '@/components/common/PageTransition';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <Outlet />
      </PageTransition>
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/common/AppSidebar';
import { TopBar } from '@/components/common/TopBar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { PageTransition } from '@/components/common/PageTransition';

interface DashboardLayoutProps {
  role: string;
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset>
        <TopBar />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

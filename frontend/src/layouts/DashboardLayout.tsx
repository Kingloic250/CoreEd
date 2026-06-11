import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/common/AppSidebar';
import { TopBar } from '@/components/common/TopBar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  role: string;
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset className="overflow-x-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

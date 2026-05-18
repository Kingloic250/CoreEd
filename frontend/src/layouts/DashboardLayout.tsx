// Main dashboard shell: sidebar + topbar for all role-based dashboards
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
      <SidebarInset>
        <TopBar />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

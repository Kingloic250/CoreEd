import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  BarChart3, ClipboardList, FileText, Bell, School,
  Calendar, Trophy, UserCheck, CalendarDays, UserPlus,
  Library, ScrollText, Shield, CalendarRange
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/utils/formatters';

const adminNav = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Students', url: '/admin/students', icon: GraduationCap },
  { title: 'Lecturers', url: '/admin/lecturers', icon: Users },
  { title: 'Courses', url: '/admin/courses', icon: BookOpen },
  { title: 'Departments', url: '/admin/departments', icon: Users },
  { title: 'Semesters', url: '/admin/semesters', icon: CalendarDays },
  { title: 'Timetable', url: '/admin/timetable', icon: CalendarRange },
  { title: 'Enrollment', url: '/admin/enrollment', icon: UserPlus },
  { title: 'Requests', url: '/admin/requests', icon: UserCheck },
  { title: 'Audit Logs', url: '/admin/audit-logs', icon: ScrollText },
  { title: 'Users', url: '/admin/users', icon: Shield },
  { title: 'Reports', url: '/admin/reports', icon: BarChart3 },
];

const lecturerNav = [
  { title: 'Dashboard', url: '/lecturer', icon: LayoutDashboard },
  { title: 'My Courses', url: '/lecturer/courses', icon: BookOpen },
  { title: 'Attendance', url: '/lecturer/attendance', icon: ClipboardList },
  { title: 'Grades', url: '/lecturer/grades', icon: Trophy },
];

const studentNav = [
  { title: 'Dashboard', url: '/student', icon: LayoutDashboard },
  { title: 'My Attendance', url: '/student/attendance', icon: Calendar },
  { title: 'My Grades', url: '/student/grades', icon: Trophy },
  { title: 'Course Catalog', url: '/student/courses', icon: Library },
  { title: 'Transcript', url: '/student/transcript', icon: FileText },
  { title: 'Announcements', url: '/student/announcements', icon: Bell },
];

const navMap: Record<string, typeof adminNav> = {
  admin: adminNav,
  lecturer: lecturerNav,
  student: studentNav,
};

const roleLabel: Record<string, string> = {
  admin: 'Administrator',
  lecturer: 'Lecturer',
  student: 'Student',
};

const roleBadgeColor: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  lecturer: 'bg-secondary text-secondary-foreground',
  student: 'bg-muted text-muted-foreground',
};

interface AppSidebarProps {
  role: string;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const { user } = useAuth();
  const navItems = navMap[role] ?? [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <div className="flex items-center gap-2 px-2 pt-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <School className="size-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'}
            </span>
            <span className="truncate text-xs text-muted-foreground">University Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin' || item.url === '/lecturer' || item.url === '/student'}
                      className={({ isActive }) => isActive ? 'data-[active=true]' : ''}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon />
                          <span>{item.title}</span>
                          {isActive && <span className="sr-only">(current page)</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="pt-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {getInitials(user?.name ?? 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.name}
            </span>
            <Badge
              variant="secondary"
              className={`w-fit text-[10px] px-1.5 py-0 mt-0.5 ${roleBadgeColor[role] ?? ''}`}
            >
              {roleLabel[role] ?? role}
            </Badge>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

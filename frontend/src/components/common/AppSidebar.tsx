import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  BarChart3, ClipboardList, FileText, Bell, School,
  ClipboardCheck, Calendar, Trophy, UserCheck, CalendarDays, UserPlus,
  Library, ScrollText, Shield, CalendarRange, Wallet, Mail, AlertCircle, Building2,
  ClipboardPen
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator, useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useGetMessages } from '@/hooks/useMessages';
import { getInitials } from '@/utils/formatters';

const adminNav = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Students', url: '/admin/students', icon: GraduationCap },
  { title: 'Lecturers', url: '/admin/lecturers', icon: Users },
  { title: 'Courses', url: '/admin/courses', icon: BookOpen },
  { title: 'Departments', url: '/admin/departments', icon: Users },
  { title: 'Semesters', url: '/admin/semesters', icon: CalendarDays },
  { title: 'Timetable', url: '/admin/timetable', icon: CalendarRange },
  { title: 'Groups', url: '/admin/groups', icon: Users },
  { title: 'Enrollment', url: '/admin/enrollment', icon: UserPlus },
  { title: 'Grades', url: '/admin/grades', icon: ClipboardCheck },
  { title: 'Exams', url: '/admin/exams', icon: ClipboardPen },
  { title: 'Requests', url: '/admin/requests', icon: UserCheck },
  { title: 'Audit Logs', url: '/admin/audit-logs', icon: ScrollText },
  { title: 'Users', url: '/admin/users', icon: Shield },
  { title: 'Reports', url: '/admin/reports', icon: BarChart3 },
  { title: 'Calendar', url: '/admin/calendar', icon: Calendar },
  { title: 'Notifications', url: '/admin/notifications', icon: Bell },
  { title: 'Rooms', url: '/admin/rooms', icon: Building2 },
];

const lecturerNav = [
  { title: 'Dashboard', url: '/lecturer', icon: LayoutDashboard },
  { title: 'My Courses', url: '/lecturer/courses', icon: BookOpen },
  { title: 'Assignments', url: '/lecturer/assignments', icon: FileText },
  { title: 'Calendar', url: '/lecturer/calendar', icon: Calendar },
  { title: 'Messages', url: '/lecturer/messages', icon: Mail },
  { title: 'Grade Claims', url: '/lecturer/claims', icon: AlertCircle },
  { title: 'Timetable', url: '/lecturer/timetable', icon: Calendar },
  { title: 'Mark Attendance', url: '/lecturer/attendance', icon: ClipboardList },
  { title: 'Attendance History', url: '/lecturer/attendance/history', icon: ClipboardCheck },
  { title: 'Enter Grades', url: '/lecturer/grades', icon: Trophy },
  { title: 'Grade Book', url: '/lecturer/grades/book', icon: ScrollText },
  { title: 'Exam Results', url: '/lecturer/exams', icon: ClipboardPen },
  { title: 'Exam Schedule', url: '/lecturer/exams/schedule', icon: Calendar },
  { title: 'Notifications', url: '/lecturer/notifications', icon: Bell },
];

const studentNav = [
  { title: 'Dashboard', url: '/student', icon: LayoutDashboard },
  { title: 'My Attendance', url: '/student/attendance', icon: Calendar },
  { title: 'My Grades', url: '/student/grades', icon: Trophy },
  { title: 'My Exams', url: '/student/exams', icon: ClipboardPen },
  { title: 'Course Catalog', url: '/student/courses', icon: Library },
  { title: 'My Studies', url: '/student/studies', icon: FileText },
  { title: 'Fee Ledger', url: '/student/fees', icon: Wallet },
  { title: 'Messages', url: '/student/messages', icon: Mail },
  { title: 'Calendar', url: '/student/calendar', icon: Calendar },
  { title: 'My Timetable', url: '/student/timetable', icon: CalendarDays },
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
  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const navItems = navMap[role] ?? [];
  const { data: messages } = useGetMessages({ userId: user?.id, folder: 'inbox' });
  const unreadCount = ((messages as Record<string, unknown>[]) ?? []).filter(
    (m) => !m.read && m.recipientId === user?.id
  ).length;

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.url === '/admin' || item.url === '/lecturer' || item.url === '/student') {
      return location.pathname === item.url;
    }
    return location.pathname.startsWith(item.url);
  };

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
                  <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.title}>
                    <NavLink to={item.url} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                      {item.title === 'Messages' && unreadCount > 0 && (
                        <Badge className="ml-auto size-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
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

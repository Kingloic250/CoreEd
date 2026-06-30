import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, User,
  BarChart3, ClipboardList, FileText, Bell, School,
  ClipboardCheck, Calendar, Trophy, UserCheck, CalendarDays, UserPlus,
  Library, ScrollText, Shield, CalendarRange, Wallet, Mail, AlertCircle, Building2,
  ClipboardPen, ChevronDown, Settings, Layers, NotebookPen,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator, useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useGetMessages } from '@/hooks/useMessages';
import { getInitials } from '@/utils/formatters';

interface NavItem { title: string; url: string; icon: typeof LayoutDashboard }
interface NavGroup { title?: string; icon?: typeof LayoutDashboard; items: NavItem[] }

const adminNav: NavGroup[] = [
  { items: [{ title: 'Dashboard', url: '/admin', icon: LayoutDashboard }] },
  {
    title: 'People', icon: Users,
    items: [
      { title: 'Students', url: '/admin/students', icon: GraduationCap },
      { title: 'Lecturers', url: '/admin/lecturers', icon: Users },
      { title: 'Users', url: '/admin/users', icon: Shield },
    ],
  },
  {
    title: 'Academic', icon: BookOpen,
    items: [
      { title: 'Courses', url: '/admin/courses', icon: BookOpen },
      { title: 'Programs', url: '/admin/programs', icon: GraduationCap },
      { title: 'Curriculum', url: '/admin/curriculum', icon: Layers },
      { title: 'Timetable', url: '/admin/timetable', icon: CalendarRange },
      { title: 'Groups', url: '/admin/groups', icon: UserPlus },
      { title: 'Enrollment', url: '/admin/enrollment', icon: UserCheck },
      { title: 'Grades', url: '/admin/grades', icon: ClipboardCheck },
      { title: 'Exams', url: '/admin/exams', icon: ClipboardPen },
    ],
  },
  {
    title: 'Structure', icon: Building2,
    items: [
      { title: 'Departments', url: '/admin/departments', icon: Users },
      { title: 'Semesters', url: '/admin/semesters', icon: CalendarDays },
      { title: 'Rooms', url: '/admin/rooms', icon: Building2 },
    ],
  },
  {
    title: 'System', icon: Settings,
    items: [
      { title: 'Requests', url: '/admin/requests', icon: UserCheck },
      { title: 'Audit Logs', url: '/admin/audit-logs', icon: ScrollText },
      { title: 'Reports', url: '/admin/reports', icon: BarChart3 },
      { title: 'Calendar', url: '/admin/calendar', icon: Calendar },
      { title: 'Notifications', url: '/admin/notifications', icon: Bell },
    ],
  },
];

const lecturerNav: NavGroup[] = [
  { items: [{ title: 'Dashboard', url: '/lecturer', icon: LayoutDashboard }] },
  {
    title: 'Teaching', icon: BookOpen,
    items: [
      { title: 'My Courses', url: '/lecturer/courses', icon: BookOpen },
      { title: 'Assignments', url: '/lecturer/assignments', icon: FileText },
      { title: 'Timetable', url: '/lecturer/timetable', icon: Calendar },
      { title: 'Mark Attendance', url: '/lecturer/attendance', icon: ClipboardList },
      { title: 'Attendance History', url: '/lecturer/attendance/history', icon: ClipboardCheck },
    ],
  },
  {
    title: 'Grading', icon: Trophy,
    items: [
      { title: 'Enter Grades', url: '/lecturer/grades', icon: Trophy },
      { title: 'Grade Book', url: '/lecturer/grades/book', icon: ScrollText },
      { title: 'Exam Results', url: '/lecturer/exams', icon: ClipboardPen },
      { title: 'Exam Schedule', url: '/lecturer/exams/schedule', icon: Calendar },
      { title: 'Grade Claims', url: '/lecturer/claims', icon: AlertCircle },
    ],
  },
  {
    title: 'Communication', icon: Mail,
    items: [
      { title: 'Calendar', url: '/lecturer/calendar', icon: Calendar },
      { title: 'Messages', url: '/lecturer/messages', icon: Mail },
      { title: 'Notifications', url: '/lecturer/notifications', icon: Bell },
    ],
  },
];

const studentNav: NavGroup[] = [
  { items: [{ title: 'Dashboard', url: '/student', icon: LayoutDashboard }] },
  {
    title: 'Academic', icon: BookOpen,
    items: [
      { title: 'My Grades', url: '/student/grades', icon: Trophy },
      { title: 'Grade Claims', url: '/student/grades/claims', icon: AlertCircle },
      { title: 'My Program', url: '/student/program', icon: GraduationCap },
      { title: 'My Enrollments', url: '/student/enrollments', icon: UserCheck },
      { title: 'My Exams', url: '/student/exams', icon: ClipboardPen },
      { title: 'Assignments', url: '/student/assignments', icon: ClipboardList },
      { title: 'Course Materials', url: '/student/materials', icon: BookOpen },
      { title: 'Course Catalog', url: '/student/courses', icon: Library },
      { title: 'My Studies', url: '/student/studies', icon: FileText },
      { title: 'Transcript', url: '/student/transcript', icon: ScrollText },
    ],
  },
  {
    title: 'Attendance', icon: Calendar,
    items: [
      { title: 'My Attendance', url: '/student/attendance', icon: Calendar },
      { title: 'My Timetable', url: '/student/timetable', icon: CalendarDays },
    ],
  },
  {
    title: 'Communication', icon: Mail,
    items: [
      { title: 'Messages', url: '/student/messages', icon: Mail },
      { title: 'Calendar', url: '/student/calendar', icon: Calendar },
      { title: 'Announcements', url: '/student/announcements', icon: Bell },
    ],
  },
  {
    title: 'Finance', icon: Wallet,
    items: [
      { title: 'Fee Ledger', url: '/student/fees', icon: Wallet },
    ],
  },
  { items: [{ title: 'Profile', url: '/student/profile', icon: User }] },
];

const navMap: Record<string, NavGroup[]> = {
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
  const groups = navMap[role] ?? [];
  const { data: messages } = useGetMessages({ userId: user?.id, folder: 'inbox' });
  const unreadCount = ((messages as Record<string, unknown>[]) ?? []).filter(
    (m) => !m.read && m.recipientId === user?.id
  ).length;

  const isActive = (url: string) => {
    if (url === '/admin' || url === '/lecturer' || url === '/student') {
      return location.pathname === url;
    }
    return location.pathname.startsWith(url);
  };

  const isGroupActive = (items: NavItem[]) => items.some((item) => isActive(item.url));

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
        {groups.map((group, gi) =>
          group.title ? (
            <Collapsible key={gi} defaultOpen={isGroupActive(group.items)}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex cursor-pointer items-center gap-2 select-none [&[data-state=open]>svg:last-child]:rotate-0">
                    {group.icon && <group.icon className="size-4 shrink-0" />}
                    <span className="flex-1 truncate">{group.title}</span>
                    <ChevronDown className="size-3 shrink-0 rotate-[-90deg] transition-transform" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
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
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ) : (
            <SidebarGroup key={gi}>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <NavLink to={item.url} onClick={() => setOpenMobile(false)}>
                          <item.icon />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="pt-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
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

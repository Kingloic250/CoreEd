import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, Moon, Sun, Monitor, ArrowRight, Info, AlertTriangle, Megaphone, GraduationCap, Timer, CloudSun, Calendar, Mail } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme-provider';
import { useGetAnnouncements } from '@/hooks/useAnnouncements';
import { useGetCalendarEvents } from '@/hooks/useCalendar';
import { useGetMessages } from '@/hooks/useMessages';
import { getInitials, formatDate } from '@/utils/formatters';
import { getUnreadAnnouncements, getUnreadCalendarEvents, getUnreadMessages, markAnnouncementRead, markCalendarEventRead, markMessageRead, markAllAnnouncementsRead } from '@/utils/notificationRead';

const priorityIcon: Record<string, typeof Megaphone> = {
  high: AlertTriangle,
  normal: Info,
};

const priorityColor: Record<string, string> = {
  high: 'text-red-500',
  normal: 'text-blue-500',
};

export function TopBar() {
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const { data: announcements } = useGetAnnouncements(user?.role);
  const list = (announcements as Record<string, unknown>[]) ?? [];

  const todayISO = new Date().toISOString().slice(0, 10);
  const nextWeekISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: calendarEvents } = useGetCalendarEvents({ startDate: todayISO, endDate: nextWeekISO });
  const calList = (calendarEvents as Record<string, unknown>[]) ?? [];

  const { data: messages } = useGetMessages({ userId: user?.id, folder: 'inbox' });
  const msgList = (messages as Record<string, unknown>[]) ?? [];

  const unreadAnnouncements = getUnreadAnnouncements(list);
  const unreadCalendarEvents = getUnreadCalendarEvents(calList);
  const unreadMessages = getUnreadMessages(msgList);
  const unreadCount = unreadAnnouncements.length + unreadCalendarEvents.length + unreadMessages.length;

  const unreadAnnIds = new Set(unreadAnnouncements.map((a) => String(a.id)));
  const unreadCalIds = new Set(unreadCalendarEvents.map((e) => String(e.id)));
  const unreadMsgIds = new Set(unreadMessages.map((m) => String(m.id)));

  const mergedNotifications = [...list, ...calList, ...unreadMessages].sort((a, b) => {
    const dateA = a.createdAt ? new Date(String(a.createdAt)).getTime() : a.date ? new Date(String(a.date)).getTime() : 0;
    const dateB = b.createdAt ? new Date(String(b.createdAt)).getTime() : b.date ? new Date(String(b.date)).getTime() : 0;
    return dateB - dateA;
  });
  const recent = mergedNotifications.slice(0, 5);

  const calIconMap: Record<string, typeof Bell> = {
    exam: GraduationCap,
    deadline: Timer,
    holiday: CloudSun,
    event: Calendar,
  };

  const calColorMap: Record<string, string> = {
    exam: 'text-red-500',
    deadline: 'text-amber-500',
    holiday: 'text-emerald-500',
    event: 'text-blue-500',
  };

  const notifPath = user?.role === 'admin'
    ? '/admin/notifications'
    : user?.role === 'lecturer'
      ? '/lecturer/notifications'
      : '/student/notifications';

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center gap-2">
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[90vw] sm:w-80" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal flex items-center justify-between">
              <span className="text-sm font-medium">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">{unreadCount} new</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mergedNotifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {recent.map((n) => {
                  const isCalEvent = ['exam', 'deadline', 'holiday', 'event'].includes(String(n.type));
                  const isMsg = !isCalEvent && !('priority' in n) && ('subject' in n);
                  if (isMsg) {
                    const isUnread = unreadMsgIds.has(String(n.id));
                    return (
                      <DropdownMenuItem
                        key={`msg-${String(n.id)}`}
                        className="flex items-start gap-3 py-3 px-4 cursor-pointer"
                        onClick={() => {
                          markMessageRead(String(n.id));
                          setNotifOpen(false);
                          navigate(`/${user?.role}/messages`);
                        }}
                      >
                        <div className="relative">
                          <Mail className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                          {isUnread && <span className="absolute -top-0.5 -right-1 size-1.5 rounded-full bg-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>{String(n.subject)}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">from {String(n.senderName)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(String(n.createdAt))}</p>
                        </div>
                      </DropdownMenuItem>
                    );
                  }
                  if (isCalEvent) {
                    const Icon = calIconMap[String(n.type)] ?? Calendar;
                    const isUnread = unreadCalIds.has(String(n.id));
                    return (
                      <DropdownMenuItem
                        key={`cal-${String(n.id)}`}
                        className="flex items-start gap-3 py-3 px-4 cursor-pointer"
                        onClick={() => {
                          markCalendarEventRead(String(n.id));
                          setNotifOpen(false);
                          navigate(`/${user?.role}/calendar`);
                        }}
                      >
                        <div className="relative">
                          <Icon className={`size-4 mt-0.5 shrink-0 ${calColorMap[String(n.type)] ?? ''}`} />
                          {isUnread && <span className="absolute -top-0.5 -right-1 size-1.5 rounded-full bg-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>{String(n.title)}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{String(n.description ?? '')}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{String(n.date)}{n.time ? ` · ${n.time}` : ''}</p>
                        </div>
                      </DropdownMenuItem>
                    );
                  }
                  const Icon = priorityIcon[String(n.priority)] ?? Megaphone;
                  const isUnread = unreadAnnIds.has(String(n.id));
                  return (
                    <DropdownMenuItem
                      key={String(n.id)}
                      className="flex items-start gap-3 py-3 px-4 cursor-pointer"
                      onClick={() => {
                        markAnnouncementRead(String(n.id));
                        setNotifOpen(false);
                        navigate(notifPath);
                      }}
                    >
                      <div className="relative">
                        <Icon className={`size-4 mt-0.5 shrink-0 ${priorityColor[String(n.priority)] ?? ''}`} />
                        {isUnread && <span className="absolute -top-0.5 -right-1 size-1.5 rounded-full bg-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>{String(n.title)}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{String(n.body ?? n.message ?? '')}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(String(n.createdAt))}</p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center justify-center gap-1 text-sm font-medium text-primary cursor-pointer"
              onClick={() => {
                markAllAnnouncementsRead(list.map((a) => String(a.id)));
                setNotifOpen(false);
                navigate(notifPath);
              }}
            >
              View all notifications
              <ArrowRight className="size-3" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="size-8 cursor-pointer">
                <AvatarImage src={user?.avatar ?? undefined} alt={user?.name} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(user?.name ?? 'U')}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[90vw] sm:w-56" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate(`/${user?.role}/profile`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {user?.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <div className="flex justify-between items-center px-4 py-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className="flex-1 flex items-center justify-center rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
                  aria-label="Light theme"
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className="flex-1 flex items-center justify-center rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
                  aria-label="Dark theme"
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className="flex-1 flex items-center justify-center rounded-md border border-border p-2 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
                  aria-label="System theme"
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setConfirmLogout(true)} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Logout"
        description="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        onConfirm={() => { logout(); navigate('/login'); }}
      />
    </header>
  );
}

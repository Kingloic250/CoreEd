import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, Settings, LogOut, Moon, Sun, Monitor, ArrowRight, Info, AlertTriangle, Megaphone } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { getInitials, formatDate } from '@/utils/formatters';

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

  const { data: announcements } = useGetAnnouncements(user?.role);
  const list = (announcements as Record<string, unknown>[]) ?? [];
  const recent = list.slice(0, 5);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifPath = user?.role === 'admin'
    ? '/admin/notifications'
    : user?.role === 'teacher'
      ? '/teacher/notifications'
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
              {recent.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {recent.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal flex items-center justify-between">
              <span className="text-sm font-medium">Notifications</span>
              {recent.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{recent.length} new</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recent.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {recent.map((n) => {
                  const Icon = priorityIcon[String(n.priority)] ?? Megaphone;
                  return (
                    <DropdownMenuItem
                      key={String(n.id)}
                      className="flex items-start gap-3 py-3 px-4 cursor-pointer"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate(notifPath);
                      }}
                    >
                      <Icon className={`size-4 mt-0.5 shrink-0 ${priorityColor[String(n.priority)] ?? ''}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{String(n.title)}</p>
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
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(user?.name ?? 'U')}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
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
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

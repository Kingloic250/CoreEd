// Top bar with user info, notifications, breadcrumb, and sidebar trigger
import { Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/utils/formatters';

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center gap-2">
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <Avatar className="size-8">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {getInitials(user?.name ?? 'U')}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

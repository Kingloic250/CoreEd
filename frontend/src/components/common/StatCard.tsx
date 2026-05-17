// Reusable KPI stat card with icon, trend indicator, and animated value
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  suffix?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'text-primary', suffix = '' }: StatCardProps) {
  const [displayed, setDisplayed] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;

  // Animate count-up on mount
  useEffect(() => {
    if (typeof value !== 'number') return;
    const duration = 800;
    const steps = 40;
    const increment = numericValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayed(numericValue);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [numericValue, value]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('rounded-md p-2 bg-muted', color)}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {typeof value === 'number' ? displayed : value}{suffix}
        </div>
        {trend && trendValue && (
          <div className={cn('flex items-center gap-1 mt-1 text-xs', trendColor)}>
            <TrendIcon className="size-3" />
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

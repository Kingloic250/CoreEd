import { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  showStatus?: boolean;
}

const STATUS_CONFIG = {
  good: { stroke: '#10b981', text: 'text-emerald-600', label: 'Good Attendance' },
  warning: { stroke: '#f59e0b', text: 'text-amber-600', label: 'At Risk' },
  danger: { stroke: '#ef4444', text: 'text-destructive', label: 'Critical' },
} as const;

export function CircularProgress({
  value,
  size = 96,
  strokeWidth = 8,
  warningThreshold = 80,
  dangerThreshold = 60,
  showStatus = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));

  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(clamped), 150);
    return () => clearTimeout(timer);
  }, [clamped]);

  const dashOffset = circumference * (1 - animatedValue / 100);

  const level =
    clamped >= warningThreshold
      ? 'good'
      : clamped >= dangerThreshold
        ? 'warning'
        : 'danger';

  const config = STATUS_CONFIG[level];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
          {clamped}%
        </span>
      </div>
      {showStatus && (
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
      )}
    </div>
  );
}

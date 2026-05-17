// Weekly attendance bar chart for admin dashboard
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AttendanceDataPoint {
  day: string;
  present: number;
  absent: number;
}

interface AttendanceChartProps {
  data: AttendanceDataPoint[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
        />
        <Bar dataKey="present" name="Present" fill="var(--primary)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="absent" name="Absent" fill="var(--destructive)" radius={[3, 3, 0, 0]} opacity={0.7} />
      </BarChart>
    </ResponsiveContainer>
  );
}

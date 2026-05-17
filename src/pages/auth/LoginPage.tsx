// Modern login page with role-based demo credentials and full validation
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, School, GraduationCap, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/utils/validators';

const demoCredentials = [
  {
    role: 'Admin',
    email: 'admin@school.rw',
    password: 'Admin@1234',
    icon: ShieldCheck,
    color: 'text-primary',
    bg: 'bg-primary/5 hover:bg-primary/10 border-primary/20',
  },
  {
    role: 'Teacher',
    email: 'teacher@school.rw',
    password: 'Teacher@1234',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:border-blue-800',
  },
  {
    role: 'Student',
    email: 'student@school.rw',
    password: 'Student@1234',
    icon: GraduationCap,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:border-emerald-800',
  },
];

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      const { useAuthStore } = await import('@/store/authStore');
      const role = useAuthStore.getState().user?.role;
      const dashMap: Record<string, string> = { admin: '/admin', teacher: '/teacher', student: '/student' };
      navigate(dashMap[role ?? ''] ?? '/login', { replace: true });
    } catch {
      toast.error('Invalid email or password. Please try again.');
    }
  };

  const fillCredentials = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: false });
    setValue('password', password, { shouldValidate: false });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-foreground/90" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(var(--background) 1px, transparent 1px), linear-gradient(90deg, var(--background) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-background text-foreground">
              <School className="size-5" />
            </div>
            <div>
              <p className="text-background font-semibold text-lg leading-none">
                {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'}
              </p>
              <p className="text-background/50 text-xs mt-0.5">School Management System</p>
            </div>
          </div>

          {/* Center content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge variant="outline" className="border-background/20 text-background/70 text-xs">
                Academic Year 2025/2026
              </Badge>
              <h2 className="text-4xl font-bold text-background leading-tight">
                Empowering education,<br />one dashboard at a time.
              </h2>
              <p className="text-background/60 text-base leading-relaxed max-w-md">
                Manage students, teachers, attendance, and grades — all in one unified platform designed for Rwandan schools.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Students', value: '480+' },
                { label: 'Teachers', value: '32' },
                { label: 'Classes', value: '24' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-background/5 border border-background/10 p-4">
                  <p className="text-2xl font-bold text-background">{stat.value}</p>
                  <p className="text-background/50 text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-background/30 text-xs">
            &copy; {new Date().getFullYear()} Greenfield Academy. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center">
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
              <School className="size-4" />
            </div>
            <span className="font-semibold text-foreground">
              {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@school.rw"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive flex items-center gap-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  className="pr-10"
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-label="Sign in"
            >
              {isLoading ? (
                <>
                  <Spinner className="size-4" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Demo credentials — only shown in mock mode */}
          {import.meta.env.VITE_MOCK_API === 'true' && (
            <>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                  Demo accounts
                </span>
              </div>

              <div className="space-y-2">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => fillCredentials(cred.email, cred.password)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer ${cred.bg}`}
                    aria-label={`Fill ${cred.role} demo credentials`}
                  >
                    <div className={`rounded-md p-1.5 bg-background/80 ${cred.color}`}>
                      <cred.icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{cred.role}</p>
                      <p className="text-xs text-muted-foreground truncate">{cred.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">click to fill</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

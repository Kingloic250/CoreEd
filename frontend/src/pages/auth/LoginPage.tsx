import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/utils/validators';

const demoCredentials = [
  {
    role: 'Admin',
    email: 'admin@greenfield.edu',
    password: 'Admin@1234',
    icon: ShieldCheck,
    color: 'text-primary',
    bg: 'bg-primary/5 hover:bg-primary/10 border-primary/20',
  },
  {
    role: 'Lecturer',
    email: 'lecturer@greenfield.edu',
    password: 'Lecturer@1234',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:border-blue-800',
  },
  {
    role: 'Student',
    email: 'student@greenfield.edu',
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
      const dashMap: Record<string, string> = { admin: '/admin', lecturer: '/lecturer', student: '/student' };
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
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative flex min-h-screen items-center justify-center p-3 sm:p-6">
        <Card className="w-full max-w-sm sm:max-w-md border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy'}
              </CardTitle>
              <CardDescription>Sign in to your university account</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@greenfield.edu"
                    className="pl-10"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" role="alert" className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                  Keep me signed in on this device
                </Label>
              </div>

              <Button type="submit" className="group w-full" disabled={isLoading}>
                {isLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>

            {import.meta.env.VITE_MOCK_API === 'true' && (
              <>
                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
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
                      <div className={`rounded-md p-1.5 bg-card/80 ${cred.color}`}>
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

            <p className="text-center text-sm text-muted-foreground">
              Need an account?{' '}
              <a href="/contact-admin" className="font-medium text-primary hover:underline">
                Contact your administrator
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import axiosInstance from '@/api/axiosInstance';

export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [checking, setChecking] = useState(true);
  const [lecturerName, setLecturerName] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenError('No invitation token found. Check your email link.');
      setChecking(false);
      return;
    }
    const check = async () => {
      try {
        const lecturer = await axiosInstance.get(`/api/v1/lecturers/invitation/${token}`);
        const data = lecturer as { firstName?: string; lastName?: string };
        setLecturerName(`${data.firstName ?? 'Lecturer'} ${data.lastName ?? ''}`);
      } catch {
        setTokenError('This invitation link is invalid or has expired.');
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setSubmitting(true);
    try {
      await axiosInstance.post('/api/v1/auth/setup-account', { token, password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="mx-auto size-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="size-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">Account Activated!</h2>
            <p className="text-sm text-muted-foreground">Your account is ready. You can now log in with your email and password.</p>
            <Button className="mt-2" onClick={() => navigate('/login')}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="size-6 text-primary" />
          </div>
          <CardTitle>Set Your Password</CardTitle>
          {lecturerName && <CardDescription>Welcome, {lecturerName}</CardDescription>}
        </CardHeader>

        {checking ? (
          <CardContent className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : tokenError ? (
          <CardContent className="text-center space-y-4 py-6">
            <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground">{tokenError}</p>
            <Button variant="outline" onClick={() => navigate('/login')}>Back to Login</Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="sp-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="sp-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    placeholder="At least 8 characters"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sp-confirm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="sp-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <Separator />

            <CardFooter className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !password || !confirmPassword}
              >
                {submitting && <Loader2 className="size-4 mr-1 animate-spin" />}
                Activate Account
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

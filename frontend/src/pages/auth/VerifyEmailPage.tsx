import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';
import { sendVerificationCode, verifyCode } from '@/api/verifyApi';

export function VerifyEmailPage() {
  const { user, setVerified, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email ?? '');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendCode = async () => {
    if (!email) return;
    setLoading(true);
    setMessage(null);
    try {
      await sendVerificationCode({ email });
      setStep('code');
      setMessage({ type: 'success', text: 'Code sent! Check your email inbox.' });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage({ type: 'error', text: e?.message ?? 'Failed to send code' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!email || !code) return;
    setLoading(true);
    setMessage(null);
    try {
      await verifyCode({ email, code });
      setVerified();
      setMessage({ type: 'success', text: 'Email verified successfully!' });
      setTimeout(() => navigate(getDashboardPath()), 1500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMessage({ type: 'error', text: e?.message ?? 'Invalid code' });
    } finally {
      setLoading(false);
    }
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
              {step === 'email' ? <Mail className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold tracking-tight">Email Verification</CardTitle>
              <CardDescription>
                {step === 'email'
                  ? 'Enter your email to receive a verification code'
                  : 'Enter the 6-digit code sent to your email'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {step === 'email' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verify-email">Email address</Label>
                  <Input
                    id="verify-email"
                    type="email"
                    placeholder="you@greenfield.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {message && (
                  <p
                    className={`text-xs rounded-md px-3 py-2 ${
                      message.type === 'success'
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-destructive bg-destructive/10'
                    }`}
                  >
                    {message.text}
                  </p>
                )}

                <Button className="w-full" onClick={handleSendCode} disabled={loading || !email}>
                  {loading ? <Spinner className="size-4" /> : 'Send Verification Code'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Verification code</Label>
                  <Input
                    id="verify-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center text-2xl tracking-[0.5em]"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Sent to <span className="font-medium">{email}</span>
                  </p>
                </div>

                {message && (
                  <p
                    className={`text-xs rounded-md px-3 py-2 ${
                      message.type === 'success'
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-destructive bg-destructive/10'
                    }`}
                  >
                    {message.text}
                  </p>
                )}

                <Button className="w-full" onClick={handleVerifyCode} disabled={loading || code.length !== 6}>
                  {loading ? (
                    <Spinner className="size-4" />
                  ) : (
                    <>
                      Verify Email
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => { setStep('email'); setCode(''); setMessage(null); }}
                    className="text-primary hover:underline"
                  >
                    Change email
                  </button>
                  <button
                    onClick={handleSendCode}
                    disabled={loading}
                    className="inline-flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Resend code
                  </button>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              <a href="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

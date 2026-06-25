import { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Key, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { useAuth } from '@/hooks/useAuth';
import { useGetCurrentStudent } from '@/hooks/useStudents';
import { profileApi } from '@/api/profileApi';
import { YEARS } from '@/utils/constants';

export function StudentProfile() {
  const { user, setUser } = useAuth();
  const { data: currentStudent } = useGetCurrentStudent();
  const studentProfile = currentStudent as Record<string, unknown> | undefined;

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (studentProfile) {
      if (studentProfile.year) setYear(studentProfile.year as string);
      if (studentProfile.gender) setGender(studentProfile.gender as string);
      if (studentProfile.dateOfBirth) setDateOfBirth(studentProfile.dateOfBirth as string);
    }
  }, [studentProfile]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await Promise.all([
        profileApi.update({ name, email }),
        profileApi.updateStudent({ year, gender, dateOfBirth }),
      ]);
      const updated = await profileApi.get();
      setUser(updated);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error('Current password is required'); return; }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      await profileApi.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Current password is incorrect');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your personal information and password" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center py-8">
            <div className="mb-4">
              <AvatarUpload name={user?.name ?? 'U'} avatarUrl={user?.avatar ?? null} />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {studentProfile?.firstName as string} {studentProfile?.lastName as string}
            </h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
            <p className="text-sm text-muted-foreground">{studentProfile?.email as string ?? user?.email}</p>
            {studentProfile?.year && (
              <p className="text-sm text-muted-foreground mt-1">Year: {String(studentProfile.year)}</p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="size-4" />
                Account Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileName">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="profileName" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileEmail">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="profileEmail" type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profileYear">Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="profileYear">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileGender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="profileGender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileDob">Date of birth</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="profileDob" type="date" className="pl-10" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="size-3 mr-1" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="size-4" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="currentPassword" type="password" className="pl-10" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="newPassword" type="password" className="pl-10" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="confirmPassword" type="password" className="pl-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline">
                <Key className="size-3 mr-1" />
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
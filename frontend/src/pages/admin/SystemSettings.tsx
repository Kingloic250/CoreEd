import { useState } from 'react';
import { toast } from 'sonner';
import { Building2, GraduationCap, Shield, Mail, Bell, ToggleLeft, Settings2, Save, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { PageHeader } from '@/components/common/PageHeader';
import { useGetSettings, useUpdateSettings } from '@/hooks/useSystemSettings';

const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'F'] as const;
const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-600', B: 'text-blue-600', C: 'text-yellow-600', D: 'text-orange-600', F: 'text-destructive',
};

const DEFAULT_GRADES = [
  { letter: 'A', min: 90, max: 100, label: 'Excellent' },
  { letter: 'B', min: 75, max: 89, label: 'Good' },
  { letter: 'C', min: 60, max: 74, label: 'Average' },
  { letter: 'D', min: 50, max: 59, label: 'Below Average' },
  { letter: 'F', min: 0, max: 49, label: 'Fail' },
];

const EVENT_TYPES = [
  { id: 'newRegistration', label: 'New Registration', desc: 'When a new account is created' },
  { id: 'gradePosted', label: 'Grade Posted', desc: 'When a grade is published for a student' },
  { id: 'assignmentDue', label: 'Assignment Due', desc: 'Reminder before assignment deadline' },
  { id: 'accountApproved', label: 'Account Approved', desc: 'When an account request is approved' },
  { id: 'attendanceMarked', label: 'Attendance Marked', desc: 'When attendance is recorded' },
  { id: 'semesterChange', label: 'Semester Change', desc: 'When a new semester is activated' },
];

const FEATURES = [
  { id: 'attendance', label: 'Attendance Module', desc: 'Track and manage student attendance' },
  { id: 'grading', label: 'Grading Module', desc: 'Record and publish student grades' },
  { id: 'messaging', label: 'Messaging', desc: 'Internal messaging between users' },
  { id: 'assignments', label: 'Assignments', desc: 'Create and submit coursework' },
  { id: 'timetable', label: 'Timetable', desc: 'Schedule and view class timetables' },
  { id: 'enrollment', label: 'Enrollment', desc: 'Course enrollment management' },
  { id: 'feeManagement', label: 'Fee Management', desc: 'Track student fees and payments' },
  { id: 'announcements', label: 'Announcements', desc: 'Broadcast announcements' },
];

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

const DEFAULTS = {
  schoolName: import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy',
  schoolTagline: 'University Management System',
  academicYear: '2025/2026',
  currentSemester: 'Semester 2',
  grades: DEFAULT_GRADES,
  selfRegistration: false,
  requireVerification: true,
  requireApproval: true,
  defaultRole: 'student',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  smtpFromName: 'Greenfield Academy',
  smtpFromEmail: '',
  showSmtpPass: false,
  minPasswordLength: 8,
  requireSpecialChar: true,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  lockoutDuration: 5,
  emailNotifications: true,
  eventNotifications: EVENT_TYPES.reduce((acc, e) => ({ ...acc, [e.id]: true }), {} as Record<string, boolean>),
  features: FEATURES.reduce((acc, f) => ({ ...acc, [f.id]: true }), {} as Record<string, boolean>),
  timezone: 'Africa/Kigali',
  dateFormat: 'DD/MM/YYYY',
};

type Settings = typeof DEFAULTS;

export function SystemSettings() {
  const { data: saved, isLoading } = useGetSettings();
  const { mutate: saveSettings } = useUpdateSettings();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  if (saved && !loaded) {
    setSettings((prev) => ({ ...prev, ...(saved as Partial<Settings>) }));
    setLoaded(true);
  }

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(settings as unknown as Record<string, unknown>);
  };

  const handleClearCache = () => {
    toast.success('Cache cleared');
  };

  const handleTestEmail = () => {
    toast.success('Test email sent');
  };

  const updateGrade = (letter: string, field: 'min' | 'max', value: number) => {
    setSettings((prev) => ({
      ...prev,
      grades: prev.grades.map((g) => (g.letter === letter ? { ...g, [field]: value } : g)),
    }));
  };

  return (
    <div>
      <PageHeader title="System Settings" description="Configure university-wide settings and preferences" />

      <Tabs defaultValue="school" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="school" className="gap-1.5"><Building2 className="size-4" /> School</TabsTrigger>
          <TabsTrigger value="grading" className="gap-1.5"><GraduationCap className="size-4" /> Grading</TabsTrigger>
          <TabsTrigger value="registration" className="gap-1.5"><Shield className="size-4" /> Registration</TabsTrigger>
          {/* <TabsTrigger value="email" className="gap-1.5"><Mail className="size-4" /> Email</TabsTrigger> */}
          <TabsTrigger value="security" className="gap-1.5"><Settings2 className="size-4" /> Security</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="size-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5"><ToggleLeft className="size-4" /> Features</TabsTrigger>
        </TabsList>

        {/* School Information */}
        <TabsContent value="school" className="space-y-6 max-w-2xl">
          <SettingsSection title="School Information" description="Basic information about the university">
            <div className="space-y-1.5">
              <Label htmlFor="schoolName">University Name</Label>
              <Input id="schoolName" value={settings.schoolName} onChange={(e) => set('schoolName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="schoolTagline">Tagline / Subtitle</Label>
              <Input id="schoolTagline" value={settings.schoolTagline} onChange={(e) => set('schoolTagline', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input id="academicYear" value={settings.academicYear} onChange={(e) => set('academicYear', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Current Semester</Label>
                <Select value={settings.currentSemester} onValueChange={(v) => set('currentSemester', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semester 1">Semester 1</SelectItem>
                    <SelectItem value="Semester 2">Semester 2</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                    <SelectItem value="Trimester 1">Trimester 1</SelectItem>
                    <SelectItem value="Trimester 2">Trimester 2</SelectItem>
                    <SelectItem value="Trimester 3">Trimester 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="Localization">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(v) => set('timezone', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Kigali">Africa/Kigali (CAT)</SelectItem>
                    <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                    <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                    <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date Format</Label>
                <Select value={settings.dateFormat} onValueChange={(v) => set('dateFormat', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Grading Scale */}
        <TabsContent value="grading" className="space-y-6 max-w-2xl">
          <SettingsSection title="Grade Scale" description="Configure letter grade cutoffs">
            {settings.grades.map((grade) => (
              <div key={grade.letter} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${GRADE_COLORS[grade.letter] ?? ''}`}>{grade.letter}</span>
                    <span className="text-sm text-muted-foreground">{grade.label}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Minimum %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={grade.min}
                      onChange={(e) => updateGrade(grade.letter, 'min', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Maximum %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={grade.max}
                      onChange={(e) => updateGrade(grade.letter, 'max', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </SettingsSection>
        </TabsContent>

        {/* Registration & Access */}
        <TabsContent value="registration" className="space-y-6 max-w-2xl">
          <SettingsSection title="Registration Settings">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Student Self-Registration</p>
                <p className="text-xs text-muted-foreground">Allow students to register themselves via the contact form</p>
              </div>
              <Switch checked={settings.selfRegistration} onCheckedChange={(v) => set('selfRegistration', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require Email Verification</p>
                <p className="text-xs text-muted-foreground">Users must verify their email before accessing the system</p>
              </div>
              <Switch checked={settings.requireVerification} onCheckedChange={(v) => set('requireVerification', v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require Admin Approval</p>
                <p className="text-xs text-muted-foreground">Account requests must be approved by an administrator</p>
              </div>
              <Switch checked={settings.requireApproval} onCheckedChange={(v) => set('requireApproval', v)} />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>Default Role for New Users</Label>
              <Select value={settings.defaultRole} onValueChange={(v) => set('defaultRole', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Email Configuration — hidden for now
        <TabsContent value="email" className="space-y-6 max-w-2xl">
          <SettingsSection title="SMTP Configuration" description="Outgoing mail server settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input id="smtpHost" value={settings.smtpHost} onChange={(e) => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" value={settings.smtpPort} onChange={(e) => set('smtpPort', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtpUser">Username</Label>
              <Input id="smtpUser" value={settings.smtpUser} onChange={(e) => set('smtpUser', e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="smtpPass">Password / App Password</Label>
              <div className="relative">
                <Input
                  id="smtpPass"
                  type={settings.showSmtpPass ? 'text' : 'password'}
                  value={settings.smtpPass}
                  onChange={(e) => set('smtpPass', e.target.value)}
                  placeholder="Enter SMTP password"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                  onClick={() => set('showSmtpPass', !settings.showSmtpPass)}
                >
                  {settings.showSmtpPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="smtpFromName">From Name</Label>
                <Input id="smtpFromName" value={settings.smtpFromName} onChange={(e) => set('smtpFromName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpFromEmail">From Email</Label>
                <Input id="smtpFromEmail" value={settings.smtpFromEmail} onChange={(e) => set('smtpFromEmail', e.target.value)} placeholder="noreply@school.edu" />
              </div>
            </div>
            <Button variant="outline" className="gap-1.5" onClick={handleTestEmail}>
              <Mail className="size-4" /> Send Test Email
            </Button>
          </SettingsSection>
        </TabsContent>
        */}

        {/* Security */}
        <TabsContent value="security" className="space-y-6 max-w-2xl">
          <SettingsSection title="Password Policy">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Minimum Password Length: {settings.minPasswordLength}</p>
                </div>
                <div className="w-48">
                  <Slider
                    value={[settings.minPasswordLength]}
                    onValueChange={([v]) => set('minPasswordLength', v)}
                    min={4}
                    max={32}
                    step={1}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Require Special Character</p>
                  <p className="text-xs text-muted-foreground">Passwords must include !@#$%^&*</p>
                </div>
                <Switch checked={settings.requireSpecialChar} onCheckedChange={(v) => set('requireSpecialChar', v)} />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection title="Session & Login">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Session Timeout: {settings.sessionTimeout} minutes</p>
                </div>
                <div className="w-48">
                  <Slider
                    value={[settings.sessionTimeout]}
                    onValueChange={([v]) => set('sessionTimeout', v)}
                    min={5}
                    max={480}
                    step={5}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Max Login Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={settings.maxLoginAttempts}
                    onChange={(e) => set('maxLoginAttempts', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Lockout Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={settings.lockoutDuration}
                    onChange={(e) => set('lockoutDuration', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6 max-w-2xl">
          <SettingsSection title="Notification Preferences">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Master toggle for all email notifications</p>
              </div>
              <Switch checked={settings.emailNotifications} onCheckedChange={(v) => set('emailNotifications', v)} />
            </div>
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Events that trigger notifications:</p>
            {EVENT_TYPES.map((event) => (
              <div key={event.id}>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm">{event.label}</p>
                    <p className="text-xs text-muted-foreground">{event.desc}</p>
                  </div>
                  <Switch
                    checked={settings.eventNotifications[event.id]}
                    onCheckedChange={(v) =>
                      setSettings((prev) => ({
                        ...prev,
                        eventNotifications: { ...prev.eventNotifications, [event.id]: v },
                      }))
                    }
                  />
                </div>
                <Separator />
              </div>
            ))}
          </SettingsSection>
        </TabsContent>

        {/* Feature Toggles */}
        <TabsContent value="features" className="space-y-6 max-w-2xl">
          <SettingsSection title="Feature Toggles" description="Enable or disable system modules">
            {FEATURES.map((feature) => (
              <div key={feature.id}>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                  <Switch
                    checked={settings.features[feature.id]}
                    onCheckedChange={(v) =>
                      setSettings((prev) => ({
                        ...prev,
                        features: { ...prev.features, [feature.id]: v },
                      }))
                    }
                  />
                </div>
                <Separator />
              </div>
            ))}
          </SettingsSection>
        </TabsContent>
      </Tabs>

      <div className="mt-8 max-w-2xl flex items-center gap-3">
        <Button onClick={handleSave} className="gap-1.5">
          <Save className="size-4" /> Save All Settings
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={handleClearCache}>
          <Trash2 className="size-4" /> Clear Cache
        </Button>
        <Button variant="ghost" className="gap-1.5">
          <RotateCcw className="size-4" /> Reset to Defaults
        </Button>
      </div>
    </div>
  );
}

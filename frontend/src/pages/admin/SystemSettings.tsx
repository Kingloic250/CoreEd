// Admin: system settings page
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/common/PageHeader';

export function SystemSettings() {
  const [settings, setSettings] = useState({
    schoolName: import.meta.env.VITE_APP_NAME ?? 'Greenfield Academy',
    academicYear: '2025/2026',
    currentSemester: 'Semester 2',
    emailNotifications: true,
    selfRegistration: false,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div>
      <PageHeader title="System Settings" description="Configure university-wide settings" />
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Information</CardTitle>
            <CardDescription>Basic information about the university</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="schoolName">University Name</Label>
              <Input
                id="schoolName"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  value={settings.academicYear}
                  onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Current Semester</Label>
                <Select
                  value={settings.currentSemester}
                  onValueChange={(v) => setSettings({ ...settings, currentSemester: v })}
                >
                  <SelectTrigger aria-label="Select semester">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semester 1">Semester 1</SelectItem>
                    <SelectItem value="Semester 2">Semester 2</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grading Scale</CardTitle>
            <CardDescription>Letter grade cutoffs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { letter: 'A', range: '90–100%', color: 'text-emerald-600' },
                { letter: 'B', range: '75–89%', color: 'text-blue-600' },
                { letter: 'C', range: '60–74%', color: 'text-yellow-600' },
                { letter: 'D', range: '50–59%', color: 'text-orange-600' },
                { letter: 'F', range: '0–49%', color: 'text-destructive' },
              ].map((grade) => (
                <div key={grade.letter} className="flex items-center justify-between py-1.5">
                  <span className={`font-semibold text-sm ${grade.color}`}>{grade.letter}</span>
                  <span className="text-sm text-muted-foreground">{grade.range}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Send automated email alerts</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
                aria-label="Toggle email notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Student Self-Registration</p>
                <p className="text-xs text-muted-foreground">Allow students to register themselves</p>
              </div>
              <Switch
                checked={settings.selfRegistration}
                onCheckedChange={(v) => setSettings({ ...settings, selfRegistration: v })}
                aria-label="Toggle self registration"
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">Save Changes</Button>
      </div>
    </div>
  );
}

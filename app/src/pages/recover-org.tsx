import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/auth-context';
import { useRecoverOrganization } from '@/hooks/use-organization-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, LogOut } from 'lucide-react';

interface RecoverOrgPageProps {
  deletedAt: string;
  recoveryDeadline: string;
  retentionDays: number;
}

export default function RecoverOrgPage({ deletedAt, recoveryDeadline }: RecoverOrgPageProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const recoverOrg = useRecoverOrganization();
  const [confirmEmail, setConfirmEmail] = useState('');

  const deadlineDate = new Date(recoveryDeadline);
  const daysLeft = Math.max(0, Math.ceil((deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

  function handleRecover() {
    recoverOrg.mutate({ confirmEmail }, {
      onSuccess: () => navigate('/'),
    });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <CardTitle>Organization Deleted</CardTitle>
          </div>
          <CardDescription>
            Your organization was deleted on {new Date(deletedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-200">
            You have <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> remaining to recover your organization.
            After <strong>{deadlineDate.toLocaleDateString()}</strong>, all data will be permanently deleted.
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recover-email">Type your email <strong>{user?.email}</strong> to recover</Label>
            <Input
              id="recover-email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={user?.email}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Recovering will restore your organization and all its data. All users will regain access.
          </p>

          {recoverOrg.isError && (
            <p className="text-sm text-destructive">{recoverOrg.error?.message}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleRecover} disabled={confirmEmail !== user?.email || recoverOrg.isPending} className="flex-1">
              {recoverOrg.isPending && <Loader2 className="size-4 animate-spin" />}
              Recover Organization
            </Button>
            <Button variant="ghost" onClick={logout}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

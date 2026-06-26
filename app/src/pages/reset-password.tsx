import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useResetPasswordMutation } from '@/hooks/use-auth-mutations';
import type { ApiError } from '@/types/auth';
import { AxiosError } from 'axios';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const mutation = useResetPasswordMutation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!token) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <p className="text-sm text-destructive">Invalid reset link.</p>
          <Link to="/forgot-password">
            <Button variant="outline">Request a new link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    setValidationError('');
    mutation.mutate({ token: token!, newPassword });
  }

  const error = mutation.error as AxiosError<ApiError> | null;
  const errorMessage = validationError || error?.response?.data?.error?.message;

  if (mutation.isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Password reset</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your password has been updated. You can now sign in.
            </p>
          </div>
          <Link to="/login">
            <Button>Sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Choose a new password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="destructive" aria-live="assertive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setValidationError('');
              }}
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setValidationError('');
              }}
              required
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

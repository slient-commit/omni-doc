import { useState } from 'react';
import { Link } from 'react-router';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForgotPasswordMutation } from '@/hooks/use-auth-mutations';
import type { ApiError } from '@/types/auth';
import { AxiosError } from 'axios';

export default function ForgotPasswordPage() {
  const mutation = useForgotPasswordMutation();
  const [email, setEmail] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({ email });
  }

  const error = mutation.error as AxiosError<ApiError> | null;
  const errorMessage = error?.response?.data?.error?.message;

  if (mutation.isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <Mail className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Check your inbox</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, we sent a password reset link.
            </p>
          </div>
          <Link to="/login">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your email to receive a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="destructive" aria-live="assertive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Sending...' : 'Send reset link'}
          </Button>

          <Link
            to="/login"
            className="cursor-pointer text-center text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLoginMutation } from '@/hooks/use-auth-mutations';
import { useAuth } from '@/contexts/auth-context';
import type { ApiError } from '@/types/auth';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const mutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          navigate('/');
        },
      },
    );
  }

  const error = mutation.error as AxiosError<ApiError> | null;
  const errorMessage = error?.response?.data?.error?.message;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Sign in</CardTitle>
        </div>
        <CardDescription>Access your document workspace</CardDescription>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="flex flex-col items-center gap-1.5 text-sm">
            <Link
              to="/forgot-password"
              className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Forgot your password?
            </Link>
            <Link
              to="/register"
              className="cursor-pointer text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Don't have an account? <span className="underline">Create one</span>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

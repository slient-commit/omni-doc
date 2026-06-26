import { useState } from 'react';
import { Link } from 'react-router';
import { Building2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRegisterMutation } from '@/hooks/use-auth-mutations';
import type { ApiError } from '@/types/auth';
import { AxiosError } from 'axios';

export default function RegisterPage() {
  const mutation = useRegisterMutation();
  const [form, setForm] = useState({
    organizationName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState('');

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setValidationError('');
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    mutation.mutate({
      organizationName: form.organizationName,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    });
  }

  const error = mutation.error as AxiosError<ApiError> | null;
  const errorMessage = validationError || error?.response?.data?.error?.message;

  if (mutation.isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <Mail className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Check your inbox</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a verification link to <strong>{form.email}</strong>. Click it to activate
              your account.
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
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Create your workspace</CardTitle>
        </div>
        <CardDescription>Set up your organization and admin account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <Alert variant="destructive" aria-live="assertive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="orgName">Organization name</Label>
            <Input
              id="orgName"
              placeholder="Acme Corp"
              value={form.organizationName}
              onChange={update('organizationName')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={update('firstName')}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={update('lastName')}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={update('password')}
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
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              required
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Creating workspace...' : 'Create workspace'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="cursor-pointer underline transition-colors duration-150 hover:text-foreground">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

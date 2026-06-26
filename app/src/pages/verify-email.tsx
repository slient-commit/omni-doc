import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerifyEmailMutation } from '@/hooks/use-auth-mutations';
import type { ApiError } from '@/types/auth';
import { AxiosError } from 'axios';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const mutation = useVerifyEmailMutation();

  useEffect(() => {
    if (token && !mutation.isSuccess && !mutation.isError && !mutation.isPending) {
      mutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="text-sm text-muted-foreground">Invalid verification link.</p>
          <Link to="/login">
            <Button variant="outline">Go to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (mutation.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying your email...</p>
        </CardContent>
      </Card>
    );
  }

  if (mutation.isError) {
    const error = mutation.error as AxiosError<ApiError>;
    const message = error?.response?.data?.error?.message || 'Verification failed';
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <XCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Verification failed</h2>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          <Link to="/login">
            <Button variant="outline">Go to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Email verified!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account is ready. You can now sign in.
          </p>
        </div>
        <Link to="/login">
          <Button>Sign in</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

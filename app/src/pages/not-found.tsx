import { Link } from 'react-router';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">404 — Page not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The page you're looking for doesn't exist.
            </p>
          </div>
          <Link to="/">
            <Button variant="outline">Go home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

import { Outlet } from 'react-router';
import { FolderOpen } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      {/* Title bar */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <FolderOpen className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight">Omni Doc</span>
      </div>

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

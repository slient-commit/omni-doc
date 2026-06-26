import { Outlet } from 'react-router';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Toolbar / address bar */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-muted/30 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm text-muted-foreground">Documents</span>
        </header>

        {/* Main content */}
        <main className="flex min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

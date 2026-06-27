import { Outlet, useLocation, useSearchParams } from 'react-router';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

// ponytail: derive page title from route
function usePageTitle() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const path = location.pathname;

  if (path === '/' && searchParams.get('folderId')) return 'Documents';
  if (path === '/') return 'All Documents';
  if (path === '/my-documents') return 'My Documents';
  if (path === '/shared') return 'Shared with Me';
  if (path === '/trash') return 'Trash';
  if (path.startsWith('/settings')) return 'Settings';
  if (path.startsWith('/documents/')) return 'Document Viewer';
  return 'Omni Doc';
}

export function AppLayout() {
  const title = usePageTitle();

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Top bar — matches sidebar header height */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">{title}</span>
        </header>

        {/* Main content */}
        <main className="flex min-h-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}

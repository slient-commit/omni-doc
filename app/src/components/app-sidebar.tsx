import { useState } from 'react';
import { Files, FolderOpen, Share2, Trash2, LogOut, Cog, ChevronRight, Folder as FolderIcon } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/contexts/auth-context';
import { useMyPermissions } from '@/hooks/use-role-queries';
import { useFolders } from '@/hooks/use-folder-queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { Folder } from '@/types/documents';

const ALL_NAV_ITEMS = [
  { label: 'All Documents', icon: Files, href: '/', perm: null },
  { label: 'My Documents', icon: FolderOpen, href: '/my-documents', perm: null },
  { label: 'Shared with Me', icon: Share2, href: '/shared', perm: null },
  { label: 'Trash', icon: Trash2, href: '/trash', perm: 'delete' as const },
];

// ponytail: recursive folder tree node, loads children on expand
function FolderTreeItem({ folder, level, activeFolderId, onNavigate }: {
  folder: Folder;
  level: number;
  activeFolderId: string | null;
  onNavigate: (uuid: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: children = [] } = useFolders(expanded ? folder.uuid : undefined);
  const hasChildren = (folder._count?.children ?? 0) > 0;
  const isActive = activeFolderId === folder.uuid;

  return (
    <div>
      <button
        className={`flex w-full cursor-pointer items-center gap-1 rounded-sm px-2 py-1 text-sm transition-colors hover:bg-accent ${isActive ? 'bg-accent font-medium' : ''}`}
        style={{ paddingLeft: `${8 + level * 12}px` }}
        onClick={() => onNavigate(folder.uuid)}
      >
        {hasChildren ? (
          <button
            className="shrink-0 cursor-pointer rounded p-0.5 hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            <ChevronRight className={`size-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        ) : (
          <span className="w-4" />
        )}
        <FolderIcon className="size-3.5 shrink-0 text-yellow-500" />
        <span className="truncate">{folder.name}</span>
      </button>
      {expanded && children.map((child) => (
        <FolderTreeItem key={child.id} folder={child} level={level + 1} activeFolderId={activeFolderId} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: myPerms } = useMyPermissions();
  const { data: rootFolders = [] } = useFolders(null);

  const activeFolderId = location.pathname === '/' ? (searchParams.get('folderId') || null) : null;
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';
  const hasPerm = (action: string, subject: string) => myPerms?.some((p) => p.action === action && p.subject === subject) ?? false;
  const canSettings = hasPerm('manage', 'organization') || hasPerm('read', 'user') || hasPerm('read', 'role');
  const canTrash = hasPerm('delete', 'document') || hasPerm('delete', 'folder');
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.perm || (item.perm === 'delete' && canTrash));

  function handleFolderNavigate(uuid: string) {
    navigate(`/?folderId=${uuid}`);
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Omni Doc</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.href && !searchParams.get('folderId')}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarGroupContent>
            {rootFolders.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">No folders yet</p>
            ) : (
              <div className="space-y-0.5">
                {rootFolders.map((folder) => (
                  <FolderTreeItem
                    key={folder.id}
                    folder={folder}
                    level={0}
                    activeFolderId={activeFolderId}
                    onNavigate={handleFolderNavigate}
                  />
                ))}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2 space-y-1">
        {canSettings && (
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-accent"
            onClick={() => navigate('/settings')}
          >
            <Cog className="h-4 w-4" />
            <span>Settings</span>
          </button>
        )}
        <div className="flex items-center gap-2 rounded-md px-2 py-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-sm">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            className="cursor-pointer rounded-md p-1 text-destructive transition-colors hover:bg-accent"
            onClick={logout}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

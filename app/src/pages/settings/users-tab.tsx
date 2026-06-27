import { useState, useRef, useEffect, useCallback } from "react";
import { useUsers, useUpdateUser } from "@/hooks/use-user-queries";
import { useRoles } from "@/hooks/use-role-queries";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InviteUserDialog } from "@/components/dialogs/invite-user-dialog";
import {
  Loader2, MoreHorizontal, Shield, UserMinus, UserCheck, UserPlus, ChevronRight,
} from "lucide-react";
import type { OrgUser } from "@/types/users";

// ponytail: native popover menu — base-ui DropdownMenu crashes with error #31
function ActionMenu({ user, roles, onChangeRole, onToggleActive }: {
  user: OrgUser;
  roles: { id: number; name: string }[];
  onChangeRole: (roleId: number) => void;
  onToggleActive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => { setOpen(false); setRoleOpen(false); }, []);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handle); document.removeEventListener("keydown", handleKey); };
  }, [open, close]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="fixed z-50 mt-1 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Actions</p>
          <div className="my-1 h-px bg-border" />
          <button
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setRoleOpen((o) => !o)}
          >
            <span className="flex items-center gap-2"><Shield className="size-4" /> Change Role</span>
            <ChevronRight className="size-3" />
          </button>
          {roleOpen && (
            <div className="ml-2 border-l pl-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => { onChangeRole(role.id); close(); }}
                >
                  {role.name}
                  {role.id === user.role.id && <Badge variant="outline" className="ml-auto text-xs">Current</Badge>}
                </button>
              ))}
            </div>
          )}
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { onToggleActive(); close(); }}
          >
            {user.isActive ? <><UserMinus className="size-4" /> Deactivate</> : <><UserCheck className="size-4" /> Activate</>}
          </button>
        </div>
      )}
    </div>
  );
}

export default function UsersTab() {
  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const updateUser = useUpdateUser();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} {users.length === 1 ? "user" : "users"} in your organization.
        </p>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" /> Invite User
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-32">Role</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell><Badge variant="secondary">{user.role.name}</Badge></TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "default" : "outline"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <ActionMenu
                  user={user}
                  roles={roles}
                  onChangeRole={(roleId) => updateUser.mutate({ id: user.id, roleId })}
                  onToggleActive={() => updateUser.mutate({ id: user.id, isActive: !user.isActive })}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

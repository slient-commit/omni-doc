import { useState, useRef, useEffect, useCallback } from "react";
import { useUsers, useUpdateUser, useDeactivateUser } from "@/hooks/use-user-queries";
import { useAuth } from "@/contexts/auth-context";
import { useRoles } from "@/hooks/use-role-queries";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteUserDialog } from "@/components/dialogs/invite-user-dialog";
import {
  Loader2, MoreHorizontal, Shield, UserMinus, UserCheck, UserPlus, Pencil, ChevronRight, Trash2,
} from "lucide-react";
import type { OrgUser } from "@/types/users";

function ActionMenu({ user, roles, isOwner, onChangeRole, onToggleActive, onEdit, onDelete }: {
  user: OrgUser;
  roles: { id: number; name: string }[];
  isOwner: boolean;
  onChangeRole: (roleId: number) => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
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
        <div className="fixed z-50 mt-1 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md" style={{ transform: 'translateX(-80%)' }}>
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { onEdit(); close(); }}
          >
            <Pencil className="size-4" /> Edit
          </button>
          {!isOwner && (
            <>
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
              <div className="my-1 h-px bg-border" />
              <button
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => { onToggleActive(); close(); }}
              >
                {user.isActive ? <><UserMinus className="size-4" /> Deactivate</> : <><UserCheck className="size-4" /> Activate</>}
              </button>
              <button
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                onClick={() => { onDelete(); close(); }}
              >
                <Trash2 className="size-4" /> Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EditUserDialog({ open, onOpenChange, user }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: OrgUser;
}) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const updateUser = useUpdateUser();

  useEffect(() => {
    if (open) { setFirstName(user.firstName); setLastName(user.lastName); }
  }, [open, user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateUser.mutate(
      { id: user.id, firstName: firstName.trim(), lastName: lastName.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) updateUser.reset(); onOpenChange(v); }}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update {user.firstName}'s details.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-fn">First name</Label>
              <Input id="edit-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-ln">Last name</Label>
              <Input id="edit-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          {updateUser.isError && <p className="mt-2 text-sm text-destructive">{updateUser.error?.message ?? "Update failed."}</p>}
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={!firstName.trim() || !lastName.trim() || updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersTab() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<OrgUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<OrgUser | null>(null);

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
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            // ponytail: can't change your own role/deactivate/delete yourself
            const isSelf = user.id === currentUser?.id;
            return (
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
                    isOwner={isSelf}
                    onChangeRole={(roleId) => updateUser.mutate({ id: user.id, roleId })}
                    onToggleActive={() => updateUser.mutate({ id: user.id, isActive: !user.isActive })}
                    onEdit={() => setEditUser(user)}
                    onDelete={() => setDeleteUser(user)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      {editUser && (
        <EditUserDialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }} user={editUser} />
      )}

      <Dialog open={!!deleteUser} onOpenChange={(o) => { if (!o) { setDeleteUser(null); deactivateUser.reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" /> Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.firstName} {deleteUser?.lastName}</strong>? This will deactivate their account.
            </DialogDescription>
          </DialogHeader>
          {deactivateUser.isError && <p className="text-sm text-destructive">{deactivateUser.error?.message}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteUser) deactivateUser.mutate(deleteUser.id, { onSuccess: () => setDeleteUser(null) }); }} disabled={deactivateUser.isPending}>
              {deactivateUser.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

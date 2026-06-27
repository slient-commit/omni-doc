import { useState, useRef, useEffect, useCallback } from "react";
import { useRoles, useDeleteRole } from "@/hooks/use-role-queries";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CreateRoleDialog } from "@/components/dialogs/create-role-dialog";
import { EditRoleDialog } from "@/components/dialogs/edit-role-dialog";
import {
  Loader2, MoreHorizontal, Pencil, Trash2, ShieldPlus, AlertTriangle,
} from "lucide-react";
import type { Role } from "@/types/users";

// ponytail: native popover — base-ui DropdownMenu crashes with error #31
function RoleActionMenu({ role, onEdit, onDelete }: {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

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
        <div className="fixed z-50 mt-1 min-w-[140px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md" style={{ transform: 'translateX(-80%)' }}>
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => { onEdit(); close(); }}
            disabled={role.isSystem}
          >
            <Pencil className="size-4" /> Edit
          </button>
          <button
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => { onDelete(); close(); }}
            disabled={role.isSystem}
          >
            <Trash2 className="size-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function RolesTab() {
  const { data: roles = [], isLoading } = useRoles();
  const deleteRole = useDeleteRole();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteRole.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

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
          {roles.length} {roles.length === 1 ? "role" : "roles"} defined.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <ShieldPlus className="size-4" /> Create Role
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-24">Users</TableHead>
            <TableHead className="w-28">Permissions</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {role.name}
                  {role.isSystem && <Badge variant="outline">System</Badge>}
                  {role.isDefault && <Badge variant="secondary">Default</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{role.description ?? "--"}</TableCell>
              <TableCell className="text-muted-foreground">{role._count?.users ?? 0}</TableCell>
              <TableCell className="text-muted-foreground">{role._count?.rolePermissions ?? 0}</TableCell>
              <TableCell>
                <RoleActionMenu
                  role={role}
                  onEdit={() => setEditRole(role)}
                  onDelete={() => setDeleteTarget(role)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editRole && (
        <EditRoleDialog
          open={!!editRole}
          onOpenChange={(open) => { if (!open) setEditRole(null); }}
          role={editRole}
          currentPermissionIds={editRole.rolePermissions?.map((rp) => rp.permissionId) ?? []}
        />
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); deleteRole.reset(); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" /> Delete Role
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Users with this role will need to be reassigned.
            </DialogDescription>
          </DialogHeader>
          {deleteRole.isError && (
            <p className="text-sm text-destructive">{deleteRole.error?.message ?? "Failed to delete role."}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteRole.isPending}>
              {deleteRole.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

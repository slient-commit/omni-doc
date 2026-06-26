import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateRole, usePermissions } from "@/hooks/use-role-queries";
import type { Role } from "@/types/users";
import { Loader2Icon, ShieldIcon } from "lucide-react";

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  currentPermissionIds: number[];
}

export function EditRoleDialog({
  open,
  onOpenChange,
  role,
  currentPermissionIds,
}: EditRoleDialogProps) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description ?? "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    currentPermissionIds
  );

  const { data: permissions } = usePermissions();
  const updateRole = useUpdateRole();

  useEffect(() => {
    if (open) {
      setName(role.name);
      setDescription(role.description ?? "");
      setSelectedPermissionIds(currentPermissionIds);
    }
  }, [open, role, currentPermissionIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || role.isSystem) return;

    updateRole.mutate(
      {
        id: role.id,
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: selectedPermissionIds,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) updateRole.reset();
    onOpenChange(value);
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Group permissions by subject
  const groupedPermissions = permissions?.reduce<
    Record<string, typeof permissions>
  >((acc, perm) => {
    const subject = perm.subject;
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(perm);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldIcon className="size-4" />
              Edit Role
            </DialogTitle>
            <DialogDescription>
              {role.isSystem
                ? "System roles cannot be modified."
                : `Update the "${role.name}" role and its permissions.`}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-role-name">Role name</Label>
              <Input
                id="edit-role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={role.isSystem}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-role-desc">Description</Label>
              <Input
                id="edit-role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                disabled={role.isSystem}
              />
            </div>

            {/* Permissions grouped by subject */}
            {groupedPermissions && (
              <div className="grid gap-3">
                <Label>Permissions</Label>
                <div className="max-h-48 overflow-y-auto rounded-lg border p-3">
                  {Object.entries(groupedPermissions).map(
                    ([subject, perms]) => (
                      <div key={subject} className="mb-3 last:mb-0">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {subject}
                        </p>
                        <div className="grid gap-1.5">
                          {perms.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`edit-perm-${perm.id}`}
                                checked={selectedPermissionIds.includes(
                                  perm.id
                                )}
                                onCheckedChange={() =>
                                  togglePermission(perm.id)
                                }
                                disabled={role.isSystem}
                              />
                              <Label
                                htmlFor={`edit-perm-${perm.id}`}
                                className="text-sm font-normal"
                              >
                                {perm.action}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {updateRole.isError && (
            <p className="mt-2 text-sm text-destructive">
              {updateRole.error?.message ?? "Failed to update role."}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={
                !name.trim() || role.isSystem || updateRole.isPending
              }
            >
              {updateRole.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

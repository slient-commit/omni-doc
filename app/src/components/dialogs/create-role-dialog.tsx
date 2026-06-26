import { useState } from "react";
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
import { useCreateRole, usePermissions } from "@/hooks/use-role-queries";
import { Loader2Icon, ShieldPlusIcon } from "lucide-react";

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
}: CreateRoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    []
  );

  const { data: permissions } = usePermissions();
  const createRole = useCreateRole();

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedPermissionIds([]);
    createRole.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createRole.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: selectedPermissionIds,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
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
              <ShieldPlusIcon className="size-4" />
              Create Role
            </DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Editor"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
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
                                id={`perm-${perm.id}`}
                                checked={selectedPermissionIds.includes(
                                  perm.id
                                )}
                                onCheckedChange={() =>
                                  togglePermission(perm.id)
                                }
                              />
                              <Label
                                htmlFor={`perm-${perm.id}`}
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

          {createRole.isError && (
            <p className="mt-2 text-sm text-destructive">
              {createRole.error?.message ?? "Failed to create role."}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={!name.trim() || createRole.isPending}
            >
              {createRole.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

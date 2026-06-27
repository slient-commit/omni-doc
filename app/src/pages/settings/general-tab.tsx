import { useState, useEffect } from "react";
import {
  useOrganization, useUpdateOrganization, useDeleteOrganization,
} from "@/hooks/use-organization-queries";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, AlertTriangle } from "lucide-react";

export default function GeneralTab() {
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const deleteOrganization = useDeleteOrganization();
  const { user, logout } = useAuth();

  const [name, setName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  // ponytail: only owner (system role) can see delete section — check via org data
  const isOrgOwner = user?.role === "Owner";
  const retentionDays = (organization as any)?.orgRetentionDays ?? 30;

  useEffect(() => {
    if (organization) setName(organization.name);
  }, [organization]);

  function handleSave() {
    if (!name.trim()) return;
    updateOrganization.mutate({ name: name.trim() });
  }

  function handleDelete() {
    deleteOrganization.mutate({ confirmEmail }, {
      onSuccess: () => {
        setDeleteOpen(false);
        logout();
      },
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
    <div className="max-w-lg space-y-6">
      <div className="space-y-4 rounded-lg border p-4">
        <div className="grid gap-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Organization name" />
        </div>

        {organization && (
          <>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Slug</Label>
              <p className="text-sm">{organization.slug}</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Created</Label>
              <p className="text-sm">
                {new Date(organization.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </>
        )}
      </div>

      {updateOrganization.isError && <p className="text-sm text-destructive">{updateOrganization.error?.message ?? "Failed to update."}</p>}
      {updateOrganization.isSuccess && <p className="text-sm text-green-600">Organization updated.</p>}

      <Button onClick={handleSave} disabled={!name.trim() || name.trim() === organization?.name || updateOrganization.isPending}>
        {updateOrganization.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save Changes
      </Button>

      {isOrgOwner && (
        <>
          <Separator />
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="size-4" /> Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground">
              Deleting this organization will disable all access. You have <strong>{retentionDays} days</strong> to recover it by logging in with your owner account.
              After that, all data will be permanently deleted.
            </p>
            <Button variant="destructive" size="sm" onClick={() => { setDeleteOpen(true); setConfirmEmail(""); deleteOrganization.reset(); }}>
              Delete Organization
            </Button>
          </div>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" /> Delete Organization
                </DialogTitle>
                <DialogDescription>
                  This action will schedule your organization for deletion. All users will lose access immediately.
                  You can recover it within <strong>{retentionDays} days</strong> by logging in with your owner account.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2">
                <Label htmlFor="confirm-email">Type your email <strong>{user?.email}</strong> to confirm</Label>
                <Input
                  id="confirm-email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={user?.email}
                  autoComplete="off"
                />
              </div>

              {deleteOrganization.isError && (
                <p className="text-sm text-destructive">{deleteOrganization.error?.message}</p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={confirmEmail !== user?.email || deleteOrganization.isPending}
                >
                  {deleteOrganization.isPending && <Loader2 className="size-4 animate-spin" />}
                  Delete permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

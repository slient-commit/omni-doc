import { useState, useEffect } from "react";
import {
  useOrganization,
  useUpdateOrganization,
} from "@/hooks/use-organization-queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

export default function GeneralTab() {
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();

  const [name, setName] = useState("");

  useEffect(() => {
    if (organization) {
      setName(organization.name);
    }
  }, [organization]);

  function handleSave() {
    if (!name.trim()) return;
    updateOrganization.mutate({ name: name.trim() });
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
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
          />
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
                {new Date(organization.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </>
        )}
      </div>

      {updateOrganization.isError && (
        <p className="text-sm text-destructive">
          {updateOrganization.error?.message ??
            "Failed to update organization."}
        </p>
      )}

      {updateOrganization.isSuccess && (
        <p className="text-sm text-green-600">Organization updated.</p>
      )}

      <Button
        onClick={handleSave}
        disabled={
          !name.trim() ||
          name.trim() === organization?.name ||
          updateOrganization.isPending
        }
      >
        {updateOrganization.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Save Changes
      </Button>
    </div>
  );
}

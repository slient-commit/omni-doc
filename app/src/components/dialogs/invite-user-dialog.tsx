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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInviteUser } from "@/hooks/use-user-queries";
import { useRoles } from "@/hooks/use-role-queries";
import { Loader2Icon, UserPlusIcon } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({
  open,
  onOpenChange,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState<number | null>(null);

  const { data: roles } = useRoles();
  const inviteUser = useInviteUser();

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRoleId(null);
    inviteUser.reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !roleId)
      return;

    inviteUser.mutate(
      {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        roleId,
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

  const isValid =
    email.trim() && firstName.trim() && lastName.trim() && roleId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlusIcon className="size-4" />
              Invite User
            </DialogTitle>
            <DialogDescription>
              Invite a new user to your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="invite-first-name">First name</Label>
                <Input
                  id="invite-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-last-name">Last name</Label>
                <Input
                  id="invite-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Role</Label>
              <Select
                value={roleId != null ? String(roleId) : undefined}
                onValueChange={(val) => setRoleId(Number(val))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {inviteUser.isError && (
            <p className="mt-2 text-sm text-destructive">
              {inviteUser.error?.message ?? "Failed to send invite."}
            </p>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={!isValid || inviteUser.isPending}
            >
              {inviteUser.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

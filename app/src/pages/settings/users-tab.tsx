import { useState } from "react";
import { useUsers, useUpdateUser } from "@/hooks/use-user-queries";
import { useRoles } from "@/hooks/use-role-queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteUserDialog } from "@/components/dialogs/invite-user-dialog";
import {
  Loader2,
  MoreHorizontal,
  Shield,
  UserMinus,
  UserCheck,
  UserPlus,
} from "lucide-react";
import type { OrgUser } from "@/types/users";

export default function UsersTab() {
  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();
  const updateUser = useUpdateUser();
  const [inviteOpen, setInviteOpen] = useState(false);

  function handleChangeRole(user: OrgUser, roleId: number) {
    updateUser.mutate({ id: user.id, roleId });
  }

  function handleToggleActive(user: OrgUser) {
    updateUser.mutate({ id: user.id, isActive: !user.isActive });
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
          {users.length} {users.length === 1 ? "user" : "users"} in your
          organization.
        </p>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" />
          Invite User
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
              <TableCell className="font-medium">
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{user.role.name}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "default" : "outline"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-8" />
                    }
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Shield className="size-4" />
                        Change Role
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {roles.map((role) => (
                          <DropdownMenuItem
                            key={role.id}
                            onClick={() => handleChangeRole(user, role.id)}
                          >
                            {role.name}
                            {role.id === user.role.id && (
                              <Badge variant="outline" className="ml-auto">
                                Current
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                      {user.isActive ? (
                        <>
                          <UserMinus className="size-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="size-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

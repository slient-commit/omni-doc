import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { useUsers } from "@/hooks/use-user-queries";
import {
  useCreateDocumentInvite,
  useDeleteDocumentInvite,
  useCreateFolderInvite,
  useDeleteFolderInvite,
  useCreateShareLink,
  useShareLinks,
  useDeleteShareLink,
} from "@/hooks/use-sharing-queries";
import { useDocument } from "@/hooks/use-document-queries";
import { useFolder } from "@/hooks/use-folder-queries";
import {
  CopyIcon,
  LinkIcon,
  Loader2Icon,
  ShareIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "folder" | "document";
  id: number | string;
}

export function ShareDialog({
  open,
  onOpenChange,
  type,
  id,
}: ShareDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [permission, setPermission] = useState<string>("view");
  const [copied, setCopied] = useState(false);

  const { data: users } = useUsers();
  const { data: shareLinks } = useShareLinks();
  const { data: document } = useDocument(type === "document" ? id : 0);
  const { data: folder } = useFolder(type === "folder" ? id : 0);

  const createDocInvite = useCreateDocumentInvite();
  const deleteDocInvite = useDeleteDocumentInvite();
  const createFolderInvite = useCreateFolderInvite();
  const deleteFolderInvite = useDeleteFolderInvite();
  const createShareLink = useCreateShareLink();
  const deleteShareLink = useDeleteShareLink();

  const inviteMutation =
    type === "document" ? createDocInvite : createFolderInvite;

  // Get existing invites from the resource detail
  const existingInvites =
    type === "document"
      ? (document as any)?.documentInvites ?? []
      : (folder as any)?.folderInvites ?? [];

  // Find share link for this resource
  const existingLink = shareLinks?.find((link) =>
    type === "document" ? link.documentId === id : link.folderId === id
  );

  const filteredUsers = users?.filter(
    (u) =>
      u.isActive &&
      (u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleInvite = () => {
    if (!selectedUserId) return;

    const payload =
      type === "document"
        ? { documentId: id, invitedUserId: selectedUserId, permission }
        : { folderId: id, invitedUserId: selectedUserId, permission };

    inviteMutation.mutate(payload as any, {
      onSuccess: () => {
        setSelectedUserId(null);
        setSearchQuery("");
      },
    });
  };

  const handleRemoveInvite = (inviteId: number) => {
    if (type === "document") {
      deleteDocInvite.mutate({ documentId: id, inviteId });
    } else {
      deleteFolderInvite.mutate({ folderId: id, inviteId });
    }
  };

  const handleCreateLink = () => {
    const data =
      type === "document" ? { documentId: id } : { folderId: id };
    createShareLink.mutate(data);
  };

  const handleCopyLink = async () => {
    if (!existingLink) return;
    const url = `${window.location.origin}/shared/${existingLink.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShareIcon className="size-4" />
            Share {type === "folder" ? "Folder" : "Document"}
          </DialogTitle>
          <DialogDescription>
            Invite users or create a public share link.
          </DialogDescription>
        </DialogHeader>

        {/* Invite users section */}
        <div className="grid gap-3">
          <Label className="text-sm font-medium">
            <UserPlusIcon className="size-4" />
            Invite users
          </Label>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={permission} onValueChange={(v) => { if (v) setPermission(v); }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User search results */}
          {searchQuery && filteredUsers && filteredUsers.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border">
              {filteredUsers.slice(0, 5).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setSearchQuery(
                      `${user.firstName} ${user.lastName}`
                    );
                  }}
                >
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-muted-foreground">{user.email}</span>
                </button>
              ))}
            </div>
          )}

          {selectedUserId && (
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Send invite
            </Button>
          )}

          {/* Current invites */}
          {existingInvites.length > 0 && (
            <div className="grid gap-1">
              {existingInvites.map(
                (invite: {
                  id: number;
                  permission: string;
                  invitedUser: {
                    id: number;
                    firstName: string;
                    lastName: string;
                    email: string;
                  };
                }) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span>
                        {invite.invitedUser.firstName}{" "}
                        {invite.invitedUser.lastName}
                      </span>
                      <Badge variant="secondary">{invite.permission}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveInvite(invite.id)}
                    >
                      <Trash2Icon className="size-3" />
                    </Button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Public link section */}
        <div className="grid gap-3 border-t pt-3">
          <Label className="text-sm font-medium">
            <LinkIcon className="size-4" />
            Public link
          </Label>

          {existingLink ? (
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/shared/${existingLink.token}`}
                className="flex-1 text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                <CopyIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteShareLink.mutate(existingLink.id)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleCreateLink}
              disabled={createShareLink.isPending}
            >
              {createShareLink.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              <LinkIcon className="size-4" />
              Create share link
            </Button>
          )}

          {copied && (
            <p className="text-xs text-muted-foreground">
              Link copied to clipboard!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

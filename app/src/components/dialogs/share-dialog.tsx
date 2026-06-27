import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUsers } from "@/hooks/use-user-queries";
import {
  useCreateDocumentInvite, useDeleteDocumentInvite,
  useCreateFolderInvite, useDeleteFolderInvite,
  useCreateShareLink, useShareLinks, useDeleteShareLink,
} from "@/hooks/use-sharing-queries";
import { useDocument } from "@/hooks/use-document-queries";
import { useFolder } from "@/hooks/use-folder-queries";
import {
  CopyIcon, LinkIcon, Loader2Icon, ShareIcon, Trash2Icon,
  UserPlusIcon, Globe, Lock,
} from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "folder" | "document";
  id: number | string;
}

export function ShareDialog({ open, onOpenChange, type, id }: ShareDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [permission, setPermission] = useState("view");
  const [copied, setCopied] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkType, setLinkType] = useState<"public" | "private">("public");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkExpiry, setLinkExpiry] = useState("");

  const { data: users } = useUsers();
  const { data: shareLinks } = useShareLinks();
  const { data: document } = useDocument(type === "document" ? String(id) : "");
  const { data: folder } = useFolder(type === "folder" ? id : "");

  const createDocInvite = useCreateDocumentInvite();
  const deleteDocInvite = useDeleteDocumentInvite();
  const createFolderInvite = useCreateFolderInvite();
  const deleteFolderInvite = useDeleteFolderInvite();
  const createShareLink = useCreateShareLink();
  const deleteShareLink = useDeleteShareLink();

  const inviteMutation = type === "document" ? createDocInvite : createFolderInvite;

  const existingInvites = type === "document"
    ? (document as any)?.documentInvites ?? []
    : (folder as any)?.folderInvites ?? [];

  // Match share links by uuid
  const existingLinks = shareLinks?.filter((link) =>
    type === "document"
      ? (link as any).document?.uuid === id || link.documentId === id
      : (link as any).folder?.uuid === id || link.folderId === id
  ) ?? [];

  const filteredUsers = users?.filter((u) =>
    u.isActive &&
    !existingInvites.some((inv: any) => inv.invitedUser?.id === u.id) &&
    (u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  function handleInvite() {
    if (!selectedUserId) return;
    const payload = type === "document"
      ? { documentId: id, invitedUserId: selectedUserId, permission }
      : { folderId: id, invitedUserId: selectedUserId, permission };
    inviteMutation.mutate(payload as any, {
      onSuccess: () => { setSelectedUserId(null); setSearchQuery(""); },
    });
  }

  function handleRemoveInvite(inviteId: number) {
    if (type === "document") deleteDocInvite.mutate({ documentId: id, inviteId });
    else deleteFolderInvite.mutate({ folderId: id, inviteId });
  }

  function handleCreateLink() {
    const data: any = type === "document" ? { documentId: id } : { folderId: id };
    if (linkExpiry) data.expiresAt = new Date(linkExpiry).toISOString();
    if (linkType === "private" && linkPassword) data.password = linkPassword;
    createShareLink.mutate(data, {
      onSuccess: () => {
        setLinkModalOpen(false);
        setLinkPassword("");
        setLinkExpiry("");
      },
    });
  }

  async function handleCopyLink(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShareIcon className="size-4" />
              Share {type === "folder" ? "Folder" : "Document"}
            </DialogTitle>
            <DialogDescription>Invite users or create a share link.</DialogDescription>
          </DialogHeader>

          {/* Invite users */}
          <div className="grid gap-3">
            <Label className="flex items-center gap-1 text-sm font-medium">
              <UserPlusIcon className="size-4" /> Invite users
            </Label>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
            </div>

            {searchQuery && filteredUsers && filteredUsers.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg border">
                {filteredUsers.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted ${selectedUserId === user.id ? 'bg-accent' : ''}`}
                    onClick={() => { setSelectedUserId(user.id); setSearchQuery(`${user.firstName} ${user.lastName}`); }}
                  >
                    <span>{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedUserId && (
              <Button size="sm" onClick={handleInvite} disabled={inviteMutation.isPending}>
                {inviteMutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
                Send invite
              </Button>
            )}

            {inviteMutation.isError && (
              <p className="text-xs text-destructive">{inviteMutation.error?.message}</p>
            )}

            {existingInvites.length > 0 && (
              <div className="grid gap-1">
                {existingInvites.map((invite: any) => (
                  <div key={invite.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{invite.invitedUser.firstName} {invite.invitedUser.lastName}</span>
                      <Badge variant="secondary">{invite.permission}</Badge>
                    </div>
                    <button
                      className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                      onClick={() => handleRemoveInvite(invite.id)}
                    >
                      <Trash2Icon className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Share links */}
          <div className="grid gap-3 border-t pt-3">
            <Label className="flex items-center gap-1 text-sm font-medium">
              <LinkIcon className="size-4" /> Share links
            </Label>

            {existingLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {link.password ? <Lock className="size-3 text-muted-foreground" /> : <Globe className="size-3 text-muted-foreground" />}
                    <span className="truncate text-xs text-muted-foreground">
                      {link.password ? 'Private' : 'Public'}
                      {link.expiresAt && ` · expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
                <button
                  className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent"
                  onClick={() => handleCopyLink(link.token)}
                  title="Copy link"
                >
                  <CopyIcon className="size-3.5" />
                </button>
                <button
                  className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                  onClick={() => deleteShareLink.mutate(link.id)}
                  title="Delete link"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={() => { setLinkModalOpen(true); setLinkType("public"); setLinkPassword(""); setLinkExpiry(""); }}>
              <LinkIcon className="size-4" /> Create share link
            </Button>

            {copied && <p className="text-xs text-green-600">Link copied!</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create link modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Share Link</DialogTitle>
            <DialogDescription>Choose link type and settings.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="flex gap-2">
              <button
                className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${linkType === 'public' ? 'border-primary bg-accent' : 'hover:bg-muted/50'}`}
                onClick={() => { setLinkType("public"); setLinkPassword(""); }}
              >
                <Globe className="size-5" />
                <span className="text-sm font-medium">Public</span>
                <span className="text-xs text-muted-foreground">Anyone with the link</span>
              </button>
              <button
                className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 transition-colors ${linkType === 'private' ? 'border-primary bg-accent' : 'hover:bg-muted/50'}`}
                onClick={() => setLinkType("private")}
              >
                <Lock className="size-5" />
                <span className="text-sm font-medium">Private</span>
                <span className="text-xs text-muted-foreground">Password protected</span>
              </button>
            </div>

            {linkType === "private" && (
              <div className="grid gap-2">
                <Label htmlFor="link-password">Password</Label>
                <Input
                  id="link-password"
                  type="password"
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="link-expiry">Expires at (optional)</Label>
              <Input
                id="link-expiry"
                type="datetime-local"
                value={linkExpiry}
                onChange={(e) => setLinkExpiry(e.target.value)}
              />
            </div>
          </div>

          {createShareLink.isError && (
            <p className="text-xs text-destructive">{createShareLink.error?.message}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateLink}
              disabled={createShareLink.isPending || (linkType === "private" && !linkPassword)}
            >
              {createShareLink.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Create link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

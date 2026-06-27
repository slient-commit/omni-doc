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
  useCreateShareLink, useShareLinks, useDeleteShareLink, useEmailShare,
} from "@/hooks/use-sharing-queries";
import { useDocument } from "@/hooks/use-document-queries";
import { useFolder } from "@/hooks/use-folder-queries";
import {
  CopyIcon, LinkIcon, Loader2Icon, ShareIcon, Trash2Icon,
  UserPlusIcon, Globe, Lock, Mail, X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMyPermissions } from "@/hooks/use-role-queries";

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
  const [emailShareOpen, setEmailShareOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailList, setEmailList] = useState<string[]>([]);
  const [emailExpiry, setEmailExpiry] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { user: currentUser } = useAuth();

  // Permission checks
  const { data: myPerms } = useMyPermissions();
  const canInvite = myPerms?.some((p) => p.action === 'create' && p.subject === 'invite') ?? false;
  const canDeleteInvite = myPerms?.some((p) => p.action === 'delete' && p.subject === 'invite') ?? false;
  const canCreateLink = myPerms?.some((p) => p.action === 'create' && p.subject === 'share_link') ?? false;
  const canDeleteLink = myPerms?.some((p) => p.action === 'delete' && p.subject === 'share_link') ?? false;

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
  const emailShare = useEmailShare();

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
    u.id !== currentUser?.id &&
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
          {canInvite && <div className="grid gap-3">
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
                    {canDeleteInvite && <button
                      className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                      onClick={() => handleRemoveInvite(invite.id)}
                    >
                      <Trash2Icon className="size-3" />
                    </button>}
                  </div>
                ))}
              </div>
            )}
          </div>}

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
                {canDeleteLink && <button
                  className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
                  onClick={() => deleteShareLink.mutate(link.id)}
                  title="Delete link"
                >
                  <Trash2Icon className="size-3.5" />
                </button>}
              </div>
            ))}

            {canCreateLink && (
              <Button variant="outline" size="sm" onClick={() => { setLinkModalOpen(true); setLinkType("public"); setLinkPassword(""); setLinkExpiry(""); }}>
                <LinkIcon className="size-4" /> Create share link
              </Button>
            )}

            {copied && <p className="text-xs text-green-600">Link copied!</p>}
          </div>

          {/* Email share section */}
          {canCreateLink && <div className="grid gap-3 border-t pt-3">
            <Label className="flex items-center gap-1 text-sm font-medium">
              <Mail className="size-4" /> Share via email
            </Label>
            <Button variant="outline" size="sm" onClick={() => { setEmailShareOpen(true); setEmailList([]); setEmailInput(""); setEmailExpiry(""); setEmailSent(false); }}>
              <Mail className="size-4" /> Send to email addresses
            </Button>
          </div>}
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

      {/* Email share modal */}
      <Dialog open={emailShareOpen} onOpenChange={setEmailShareOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Share via Email</DialogTitle>
            <DialogDescription>Send a unique link to each email address.</DialogDescription>
          </DialogHeader>

          {emailSent ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Mail className="size-10 text-green-500" />
              <p className="text-sm font-medium">Emails sent successfully!</p>
              <Button variant="outline" size="sm" onClick={() => setEmailShareOpen(false)}>Done</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Email addresses</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const email = emailInput.trim().replace(/,$/,'');
                        if (email && email.includes('@') && !emailList.includes(email)) {
                          setEmailList([...emailList, email]);
                          setEmailInput('');
                        }
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" onClick={() => {
                    const email = emailInput.trim();
                    if (email && email.includes('@') && !emailList.includes(email)) {
                      setEmailList([...emailList, email]);
                      setEmailInput('');
                    }
                  }}>Add</Button>
                </div>
                {emailList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {emailList.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1 pr-1">
                        {email}
                        <button className="cursor-pointer rounded-full p-0.5 hover:bg-accent" onClick={() => setEmailList(emailList.filter((e) => e !== email))}>
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email-expiry">Expires at (optional)</Label>
                <Input id="email-expiry" type="datetime-local" value={emailExpiry} onChange={(e) => setEmailExpiry(e.target.value)} />
              </div>

              {emailShare.isError && <p className="text-xs text-destructive">{emailShare.error?.message}</p>}

              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailShareOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    const data: any = { emails: emailList };
                    if (type === 'document') data.documentId = id;
                    else data.folderId = id;
                    if (emailExpiry) data.expiresAt = new Date(emailExpiry).toISOString();
                    emailShare.mutate(data, { onSuccess: () => setEmailSent(true) });
                  }}
                  disabled={emailList.length === 0 || emailShare.isPending}
                >
                  {emailShare.isPending && <Loader2Icon className="size-4 animate-spin" />}
                  Send ({emailList.length})
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

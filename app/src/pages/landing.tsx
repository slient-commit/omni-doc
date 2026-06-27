import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  FolderOpen, Shield, Users, Share2, FileText, Lock,
  Archive, Search, ArrowRight, Github, CheckCircle2,
  Zap, Globe, Eye,
} from 'lucide-react';

const FEATURES = [
  { icon: FolderOpen, title: 'File Explorer Interface', desc: 'Navigate files and folders with a familiar desktop-like experience. Grid and list views, breadcrumbs, and context menus.' },
  { icon: Shield, title: 'Granular Permissions', desc: 'Custom roles with 27 permission types. Control who can create, edit, delete, move, and copy — per item.' },
  { icon: Lock, title: 'Privacy Controls', desc: 'Make any file or folder private. Owners control visibility and set per-item permissions that cascade to subfolders.' },
  { icon: Share2, title: 'Flexible Sharing', desc: 'Invite org users with view/edit access, create public links with passwords and expiry, or share via email.' },
  { icon: Users, title: 'Multi-Tenant Organizations', desc: 'Each org gets isolated storage, users, and roles. Invite team members with email verification.' },
  { icon: FileText, title: 'Document Preview', desc: 'Preview PDFs, images, text, video, and audio inline. No downloads needed to check a file.' },
  { icon: Archive, title: 'ZIP Import & Export', desc: 'Upload ZIP archives to extract entire folder structures. Export your full org as a downloadable ZIP.' },
  { icon: Eye, title: 'Audit & Recovery', desc: 'Soft-delete with configurable retention. Trash auto-cleanup. Organization recovery period after deletion.' },
];

const HIGHLIGHTS = [
  'Self-hosted — your data stays on your servers',
  'Docker deployment in under 5 minutes',
  'Role-based access with customizable permissions',
  'Email notifications via Resend',
  'File preview for PDF, images, video, audio',
  'Secure sharing with password-protected links',
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <FolderOpen className="size-5 text-primary" />
            <span className="font-semibold">Omni Doc</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/slient-commit/omni-doc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="size-4" /> GitHub
            </a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started <ArrowRight className="size-3.5" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center sm:py-36">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="size-3.5 text-primary" />
            Open source &amp; self-hosted
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your documents,<br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              organized &amp; secure.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Omni Doc is a self-hosted document management platform built for teams.
            Upload, organize, preview, and share files with fine-grained access control — all from your browser.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Create your workspace <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="https://github.com/slient-commit/omni-doc" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                <Github className="size-4" /> Star on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Social proof / highlights */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-sm">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything your team needs</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Built for organizations that need secure document storage with real access control — not just a shared drive.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-accent/30">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/20 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
            <p className="mt-3 text-muted-foreground">Three steps to a fully functional document workspace.</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: 'Deploy', desc: 'Clone the repo and run docker compose up. That\'s it.' },
              { step: '2', title: 'Create your org', desc: 'Register an account. Your organization and admin role are set up automatically.' },
              { step: '3', title: 'Invite your team', desc: 'Add users, assign roles, upload documents, and start collaborating.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deploy CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Globe className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Ready to take control of your documents?</h2>
          <p className="mt-3 text-muted-foreground">
            Deploy on your own infrastructure. No vendor lock-in, no data leaving your servers.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Start for free <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
              <div className="size-2.5 rounded-full bg-red-400" />
              <div className="size-2.5 rounded-full bg-yellow-400" />
              <div className="size-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-muted-foreground">Terminal</span>
            </div>
            <div className="p-4 text-left">
              <code className="text-sm">
                <span className="text-muted-foreground">$</span> git clone https://github.com/slient-commit/omni-doc.git<br />
                <span className="text-muted-foreground">$</span> cd omni-doc<br />
                <span className="text-muted-foreground">$</span> cp .env.example .env<br />
                <span className="text-muted-foreground">$</span> docker compose up --build
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <FolderOpen className="size-4 text-primary" />
            <span className="text-sm font-medium">Omni Doc</span>
            <span className="text-sm text-muted-foreground">&middot; Open source document management</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="https://github.com/slient-commit/omni-doc" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
              <Github className="size-4" />
            </a>
            <span>&copy; {new Date().getFullYear()} Omni Doc</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

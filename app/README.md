# omni-doc app

Frontend for omni-doc — **React 19** + **Vite 6** + **TypeScript**, styled with
**shadcn/ui** on **Tailwind CSS v4**.

## Requirements

- Node.js >= 20.9 (see [.nvmrc](.nvmrc))

> The project's other tooling runs on Node 14, but this app needs Node 18+.
> With nvm: `nvm use` (Windows: `nvm use 20.9.0`).

## Setup

```bash
cd app
npm install
```

## Scripts

```bash
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build
npm run lint      # run ESLint
```

## shadcn/ui

Components live in [src/components/ui/](src/components/ui/). Add more with:

```bash
npx shadcn@latest add <component>   # e.g. dialog, dropdown-menu, table
```

Configuration is in [components.json](components.json); the `@/*` import alias
maps to `src/*` (wired in `tsconfig*.json` and `vite.config.ts`). Theme tokens
(colors, radius, dark mode) are defined in [src/index.css](src/index.css).

## Structure

```
app/
├── src/
│   ├── components/ui/   # shadcn/ui components
│   ├── lib/utils.ts     # cn() class-merge helper
│   ├── App.tsx          # demo page
│   ├── main.tsx         # React entry
│   └── index.css        # Tailwind + theme tokens
├── components.json      # shadcn/ui config
└── vite.config.ts
```

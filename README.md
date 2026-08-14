# Datamatics Business Solutions — Pulse

A business-to-business campaign management and lead generation portal. Clients
watch their campaigns deliver; the operations team runs intake, quality control,
delivery and billing behind the same data.

There is no backend. Every figure on screen comes from local mock data designed
to mirror the warehouse being built alongside it, so the swap to a real
Application Programming Interface (API) is a change of data source rather than a
rewrite.

## Running it

```bash
npm i          # install
npm run dev    # dev server on port 3000
npm run build  # production build into dist/ (tsc --noEmit && vite build)
```

There is no test framework. The readability audit below is the automated gate.

```bash
npm run typecheck        # ~21s, the gate to run while iterating
npm run audit:contrast   # WCAG AA sweep, needs `npm run dev` running
```

## Where things live

- `src/app/routes.tsx` — every route, across the client, internal ops and UNION ops mirrors
- `src/app/context/AuthContext.tsx` — mock role-based access (`ops_manager`, `campaign_manager`, `campaign_backup`, `client`)
- `src/app/types.ts` — shared TypeScript interfaces
- `src/app/data/`, `src/app/mockData.ts` — the mock warehouse
- `src/app/components/ui/DataTable.tsx` — the standard for every long list
- `src/styles/` — design tokens, light in `design-system.css` and dark in `dark.css`
- `scripts/contrast-audit.mjs` — the readability sweep

`CLAUDE.md` carries the working rules for this codebase, including the token
architecture, the dark-mode mechanics and the contrast requirements. Read it
before changing anything to do with colour.

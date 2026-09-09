# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm i          # Install dependencies (~8s cold)
npm run dev    # Start dev server on port 3000
npm run build  # Production build into dist/ (~22s)
```

No test framework is configured. The contrast audit and browser checks (both
below) are the automated gates.

**`npm run build` is `tsc --noEmit && vite build`.** Running `npm run typecheck`
and then `npm run build` typechecks the project twice for no benefit — that is
20 wasted seconds every iteration. While iterating, `npm run typecheck` (~21s)
is the whole gate; run the full build once before pushing.

### If vite dies with `Bus error`

`.claude/hooks/session-start.sh` repairs this automatically on session start, so
you should never hit it — but if you do, this is what it is, because the symptom
is a bare `Bus error` with no stack trace and it is expensive to diagnose cold:

1. **npm cannot reach the registry through the agent proxy.** The proxy's own
   `noProxy` list contains `registry.npmjs.org`, so routing npm through it gives
   `ECONNRESET` partway through and leaves a partial `node_modules`. Install with
   the registry bypassed:
   ```bash
   npm_config_https_proxy= npm_config_noproxy=registry.npmjs.org npm i
   ```
2. **That partial install leaves native `.node` binaries truncated** — the ELF
   header points past end-of-file (`file` reports `missing section headers at …`).
   Mapping one raises SIGBUS, which kills vite in *both* dev and build.
   `lightningcss` is the usual casualty, reached via `@tailwindcss/vite`.
   **Re-running `npm i` does not fix it** — npm sees the package directory and
   considers it satisfied. Delete the package first:
   ```bash
   rm -rf node_modules/lightningcss*   # then reinstall as above
   ```

Quickest probe for which native module is bad: `node -e "require('lightningcss')"`.
Exit code 135 is SIGBUS.

## Working in this repo

Changes here are usually small and surgical — a token, a handful of class
strings, one component. Inventory first (`grep` for the token or literal across
`src/`), then edit inline. Fanning work out to subagents costs far more in
setup than it saves at this size, and parallel `npm run build` invocations
contend for the same cores. Reserve that for genuinely large, independent
workloads.

Verify with the cheapest instrument that actually settles the question. For a
colour or token change that means computed style in a browser, or grepping the
built CSS in `dist/assets/` — not screenshot diffs, which the animated counters
and staggered entrance animations make non-deterministic.

## Architecture

**Datamatics Business Solutions** (product name **Pulse**) is a business-to-business
campaign management and lead generation portal. It began as a Figma Make export;
that scaffolding has since been removed, so treat it as an ordinary React single
page application and don't go looking for Figma conventions.

**Stack:** React 18 + React Router 7 + Vite 6 + Tailwind CSS 4 + TypeScript

**Entry points:**
- `src/main.tsx` — bootstraps the app with a splash screen
- `src/app/App.tsx` — wraps the router with `AuthContext` and `NotificationContext`
- `src/app/routes.tsx` — defines every route (client, internal ops and the UNION ops mirror)

**Auth & roles:** `src/app/context/AuthContext.tsx` implements mock role-based access with four roles: `ops_manager`, `campaign_manager`, `campaign_backup`, `client`. There is no real backend auth — everything is mocked.

**The personas that matter, and how to become one.** The signed-in user is a
plain id in `sessionStorage` under the key `signed-in-user-id` (`SESSION_KEY` in
`AuthContext.tsx`). Three ids carry most of the behaviour:

| id | who | what is different |
|---|---|---|
| `u1` | standard client | the baseline client experience |
| `u9` | UNION client preview | the dense, intelligence-first build |
| `u10` | UNION OPS | the operations mirror at `/ops-union` |

`showFutureModules(user)` in `src/app/config/demo.ts` is true for **u9 only**,
and it gates whole modules, not just decoration. Two consequences that are easy
to trip over:

- `/leads` renders `UnionLeadsPage` for u9 and `StandardLeadsPage` for everyone
  else, from inside `LeadsPage.tsx`. They are different pages with different
  interaction models: the standard one opens `LeadDetailDrawer` (600px), the
  UNION one navigates to a full briefing page, deliberately, because a signal
  contact's briefing carries a synthesis block, a committee strip and a tech
  stack that do not fit a drawer.
- `/leads/:leadId` (the briefing) is gated to u9 and redirects everyone else
  back to `/leads`. So a link to a briefing from any non-u9 surface is dead by
  construction. This was caught by browser verification after it had already
  been written; check the gate before adding a route link.

**Pages split by persona:**
- Client-facing: Dashboard, CampaignList, CampaignDetailGlass, Invoices, Payment, Leads, Reports, Documents, Support, Feedback
- Internal/ops: InternalDashboard, InternalCampaignList, InternalReports, OpsOverviewPage, ManagerDashboardPage, TeamManagementPage, ClientAssignmentPage, CampaignApprovalsPage

**Component library:** `src/app/components/ui/` holds the shared primitives, and
it is small on purpose: `DataTable`, `MobileCardList`, `InsightStrip`,
`WowBadge`, plus three shadcn wrappers (`button`, `drawer`, `dropdown-menu`).
The rest of that scaffold was deleted as the app grew its own components.
Everything else lives directly in `src/app/components/` (`EmptyState`,
`ChartCard`, `DistributionBars` and so on). Look there before adding a library.

**Types:** All shared TypeScript interfaces live in `src/app/types.ts`.

**Mock data:** the app has no live API; every figure on screen is local.
`src/app/mockData.ts` (campaigns, the 35-row `mockLeads` table), `mockInvoices.ts`,
and `src/app/data/` for the derived layers (`propensity.ts`, `signalRoom.ts`,
`syndicationPerformance.ts`, `priorityAccounts.ts`, `insights.ts`, `unionOps.ts`,
`mockClients.ts`).

**Derived data must reconcile with the figure above it.** The discipline
`getCohortBreakdown` and `getAccountFunnel` set is the house style: derive from
the campaign record so the parts always sum to the whole, and never call
`Math.random` (charts must be stable across reloads, so use the `seedOf` and
`splitTotal` helpers at `propensity.ts:467` and `:474`, which are module-private
today and need exporting if another module wants them). A client screenshotting
two panels must not be able to catch them disagreeing.

**Styling:** Tailwind CSS is the primary styling system. Global CSS files live in `src/styles/` (`index.css`, `theme.css`, `design-system.css`, `animations.css`, `components.css`).

**Path alias:** `@` resolves to `src/`.

**Vite chunk splitting:** react-vendor, chart-vendor (Recharts), icon-vendor (Lucide), ui-vendor (Radix dropdown-menu), animation-vendor (Motion).

**Keep `package.json` honest.** The Figma export shipped 42 packages nothing ever
imported, including all of MUI and Emotion, and they survived months because
Vite tree-shakes them out of the bundle so no build metric ever complained. They
still cost 237MB of `node_modules` and 16 seconds on every clean install. Before
adding a dependency, check whether the app already has one; when you remove the
last import of one, remove the package in the same commit. This check finds
them:

```bash
node -e 'const{execSync}=require("child_process");for(const d of Object.keys(require("./package.json").dependencies))if(!execSync(`grep -rl -F ${JSON.stringify(d)} src/ scripts/ index.html vite.config.ts||true`,{encoding:"utf8"}).trim())console.log(d)'
```

Two false positives to expect: `terser` (named in `vite.config.ts` as the
minifier) and the two `@fontsource-variable` packages (imported from CSS).
Editing `package.json` by hand then running `npm install` prunes the lockfile
while holding every other resolution steady. Do **not** delete
`package-lock.json` to force a rebuild; that drifted 84 transitive packages,
TypeScript 5.7 to 5.9 among them, in a commit that was supposed to only remove
things.

## Design system

**Font:** Plus Jakarta Sans (`@fontsource-variable/plus-jakarta-sans`, family name `'Plus Jakarta Sans Variable'`).

**Colour comes from tokens, never literals.** `src/styles/design-system.css` defines the light `--color-*` tokens; `src/styles/dark.css` (imported last) overrides them under `:root[data-theme="dark"]`. Use `var(--color-…)` or `text-[var(--color-…)]` — a hardcoded hex will not follow the theme.

**Dark mode has two mechanisms and `ThemeContext` drives both:** it stamps `data-theme` on `<html>` (which the token layer keys off) *and* toggles a `.dark` class (which Tailwind's `dark:` variant keys off, per `@custom-variant dark` in `theme.css`). A small inline script in `index.html` stamps the theme before first paint to avoid a white flash.

**Tailwind's grey ramp is mirrored in dark.** `dark.css` redefines `--color-gray-50…950` so every `text-gray-*` / `bg-gray-*` / `border-gray-*` flips automatically. Consequences:
- Do **not** add `dark:*-gray-*` overrides — they fight the mirror and resolve to a light value on a dark ground.
- Do not mix a constant (`from-white`) with a ramped grey in one gradient; the constant won't flip.

**Fixed colours that must NOT be tokenized:** white text on brand-coloured buttons, logo and card-brand marks, and `TaxInvoiceDocument.tsx` (a printed document).

**Chrome that must contrast against the page** — tooltips, toasts — uses `--color-surface-inverse` / `--color-text-inverse`. Never use a *text* token as such a background: `--color-text-primary` is only coincidentally dark in light mode and inverts into a white pill in dark.

**Long lists use `DataTable`** (`src/app/components/ui/DataTable.tsx`) — sorting, search, filter slot, empty state, pagination, and a mobile card fallback. This is the standard; don't hand-roll a table.

## Design & Coding Rules

- **Never** use `figma:asset` imports or local file paths for images — use external URLs (Unsplash, `https://placehold.co`) or icons instead.
- No inline styles; use Tailwind classes.
- Primary brand color: `#BA2027`. Do not hardcode colors outside the Tailwind config/design tokens.
- All components must support dark **and** light mode.
- Data tables must be sortable with clear column headers; empty states must show a helpful message.
- Currency: `$12,500` format. Dates: `Jan 15, 2026` format.
- Buttons need hover and active states; form inputs need focus states using the brand color.
- Keep files small — extract reusable components and helpers into their own files.
- Use flexbox/grid for layout; avoid absolute positioning unless truly necessary.

## Readability

**Every text/background pair must clear WCAG AA** — 4.5:1 for body text, 3:1 for
large text (≥24px, or ≥18.66px bold). Icons, bars and dots are not text and are
held to 3:1 as non-text contrast.

Run `npm run audit:contrast` (with `npm run dev` up) to check. It walks 21
routes across four personas in both themes, composites translucent backgrounds
properly, and groups failures by colour pair so the output names the offending
token rather than listing every node.

**It opens every tab panel, not just the landing one.** Tabs render one panel
at a time, so on `/campaigns/:id` the audit used to measure one of four and the
other three (Reach, Audience, Advertising) were never checked at all. Failures
are reported as `route#TabLabel`. This is why the sweep measures ~8,900 nodes
rather than ~4,000, and it is what caught `--color-chart-2` sitting at 2.25:1
in dark mode.

**Scope it while iterating; sweep before pushing.** The full run is ~57s, but a
colour change usually touches one or two screens:

```bash
npm run audit:contrast -- --user=u9 --theme=dark --route=/campaigns   # ~10s
npm run audit:contrast                                                # full, ~57s
```

`--route` is a substring match, so `--route=/campaigns` also covers
`/campaigns/:id`. The run prints how many text nodes it measured; that count is
reproducible node-for-node between runs, so a sudden drop means the audit
stopped seeing part of the page, not that the page got simpler.

Three things in the script exist for correctness or speed and must not be
"simplified" away. It aborts every off-origin request (the app pulls ~14
external images that hang in a browser with no proxy — that alone was 60% of
the old 108s runtime). It waits for the DOM to stop changing rather than
sleeping a fixed 2.1s per route, and the settle needs *three* consecutive
stable samples; at two, a mid-mount lull reads as "finished" and late sections
drop out of the audit silently. And it detects the tab strip *after*
measuring the first panel, never before — under parallel load the chrome settles
while the tabs are still mounting, so an early read reports "no tabs" and quietly
audits a quarter of the page. Polling first was not enough: the same scoped run
gave 744 nodes normally and 4,200 with `AUDIT_VERBOSE`, because the extra logging
slowed it just enough for the tabs to appear. Measuring first removes the race,
since by then the page has demonstrably finished rendering.

Two structural rules the audit exists to protect:

- **`--color-primary` is the brand as *type*; `--color-primary-solid` is the
  brand as a *fill under white text*.** They cannot be one token: in dark mode
  text on the ground wants to be light and a fill under white wants to be dark.
  `--gradient-primary` is built from the solid ramp for the same reason. Any
  `background` set to `--color-primary` with white text on it is a bug.
- **A token only does the job it is named for.** A border colour as a text
  colour measured 1.19:1; `--color-gray-400` as a KPI label measured 2.53:1.

The semantic colours (`--color-success` / `-warning` / `-error` / `-info`) are
tuned so they are legible *as words* on white, on the app ground and on their
own 10% tint — they are used as type in roughly 300 places, so a value picked
only for hue fails most of them.

## Verifying in a browser

Assert behaviour by driving the page, not by reading the diff and hoping. This
has repeatedly caught things review would not: a link that silently redirected,
a mobile card whose value ran 78px off a 390px screen, an audit that was
measuring a quarter of the page.

Playwright is **not** a project dependency. It is installed globally, and
Chromium is pre-installed, so a scratch script starts like this:

```js
const mod = await import('/opt/node22/lib/node_modules/playwright/index.js');
const chromium = mod.chromium ?? mod.default?.chromium;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

`scripts/contrast-audit.mjs` has a `loadChromium()` that resolves both paths
with a fallback; copy it rather than re-deriving it. Sign in by stamping
sessionStorage and reloading:

```js
await page.evaluate(u => sessionStorage.setItem('signed-in-user-id', u), 'u9');
await page.reload({ waitUntil: 'domcontentloaded' });
```

Abort off-origin requests (`page.route`) or the ~14 external images will hang
the run. And remember `DataTable` renders the desktop table **and** the mobile
cards into the DOM at once, hiding one with `md:hidden`, so a naive
`querySelectorAll` counts every row twice; filter on
`el.getClientRects().length > 0` when you need what is actually visible.

## Working with git here

One branch per unit of work, squash-merged into `main` through a pull request.
Because merges are squashed, **always cut a new branch from a freshly fetched
`main`**. Reusing a branch that still holds the individual commits of an
already-merged pull request makes every touched file conflict with its own
squashed twin; recovering means rebuilding the branch and cherry-picking the
genuinely new commits. That has happened once, do not repeat it.

Do not run two sessions against this repo at the same time unless they are on
clearly separate areas.

## Where things stand

Context a new session would otherwise have to reconstruct. Update this when it
stops being true.

**There is no backend, and that is deliberate for now.** Gourav is building one
warehouse that pulls Propensity and Relish and holds the content syndication
data; Pulse will read from it and never write. A field-level requirements
document covering 22 tables and 222 fields has been shared with him, framed as
recommendations, since the final schema is his call. Margin and cost arithmetic
happens on his side; the client sees one combined spend figure.

**Seven gaps are known**, places where a panel exists in the product but no
warehouse field can fill it yet. One of them cannot be fixed retrospectively:
Propensity keeps no history, so any account-level trend before snapshots begin
is unrecoverable.

**Some selectors are more confident than the warehouse will be.**
`getAssetPerformance` and `getLeadDisposition` split a single total across
categories rather than aggregating rows. There is a written plan to reshape the
mock so it mirrors the real schema (making the swap a change of data source
rather than a rewrite), deliberately held until Gourav's field list settles so
the mapping is not done twice.

**Real authentication is unbuilt and is the expensive part of going live.**
Roles are `mockUsers` plus sessionStorage. Reading from a real API is
comparatively easy, since the ~76 selectors are the whole surface; writing is
what needs auth, sessions and secrets.

**Cost, CPL, budget and pacing are ops-only.** Never surface them in a
client-visible panel. Lead vocabulary is delivered / accepted / suppressed, not
MQL / MQA / SQO.

## Writing style for anything a person reads

Applies to every document, artifact page, email draft, commit message, pull
request body and chat reply written for Vishal or his colleagues. Code comments
are the one exception; those match the surrounding code.

The goal is prose that reads as if a person wrote it. Most of the tells below
are not wrong English, they are just the specific habits that mark text as
machine-written, so they get avoided even where they would otherwise be fine.

### Words and phrases to avoid

**Stock phrases.** "in today's fast-paced world", "in the ever-evolving world",
"in the realm of", "it's important to note", "aims to explore", "when it comes
to", "at the end of the day", "navigating the landscape", "because of this",
"in other words", "overall".

**Inflated adjectives.** revolutionary, groundbreaking, cutting-edge,
paradigm-shifting, transformative, game-changing, disruptive, innovative,
comprehensive, robust, seamless, holistic, pivotal, crucial, paramount,
quintessential, remarkable, amazing, striking, captivating, significant,
substantial, notable, considerable, meticulous, intricate, multifaceted,
profound.

**Verbs.** delve, dive, unlock, unleash, harness, leverage, orchestrate,
streamline, facilitate, enhance, showcase, underscore, spearhead,
revolutionize, transcend, galvanize, cultivate, proliferate, utilize,
strategize, synthesize, delineate, articulate, conceptualize, manifest,
elucidate, inquire, discern, unveil.

**Nouns.** journey, landscape, realm, tapestry, symphony, odyssey, paradigm,
nexus, spectrum, trajectory, synergy, alignment, benchmark, milestone, facet,
epitome, pinnacle, testament, gusto.

**Transitions and hedges.** moreover, furthermore, therefore, consequently,
subsequently, accordingly, nevertheless, however, indeed, notably,
particularly, additionally, "it seems that", "it appears", "one could argue",
"might", "can be", "tends to", "appears to be", "could potentially", "seems to
suggest".

Write plainly instead. Vary sentence length, mixing short ones with long ones.
Use ordinary transitions like also, then, so and but. Use contractions. Use I,
you and we. Give concrete examples and real numbers rather than descriptions of
how important something is. A rhetorical question or a slightly loose sentence
is fine; it reads as human.

### Punctuation

**No em dashes.** This is the single biggest tell. Use a comma, a period, a
semicolon or parentheses instead. Never stack them, never use one where a comma
would do.

**No colons in titles or headings,** and none before a short list or a casual
explanation. Reach for "such as", "for example" or "including" instead.

**Straight quotes and apostrophes only** (" and '), never curly ones.

Parentheses are for real asides, used sparingly. Semicolons are fine and should
be used naturally to join related clauses. Quotation marks are for actual quotes,
dialogue and citations, not for emphasis or paraphrase.

Don't default to bullet points, especially nested ones. Flowing prose is better
for anything that explains or narrates; keep lists for things that genuinely
are lists. Perfect, uniform punctuation reads as machine output, so some
variation is good. Ellipses are fine for a genuine trailing thought, and an
exclamation mark is fine where the tone actually calls for one.

### Abbreviations

Spell them out the first time and put the short form in brackets after, like
"Application Programming Interface (API)". In documents written for people
outside engineering, avoid them entirely where a plain phrase works.

## Delivering work

End every piece of finished work with its link, without being asked. Code
changes get the Vercel preview links once pushed; documents get their artifact
links; files get sent as attachments. Vishal should never have to ask "where
is it" after something is built.

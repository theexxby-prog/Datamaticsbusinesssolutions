// ─── Panel screenshots ───────────────────────────────────────────────────────
// Captures one cropped image per product panel, for the database requirements
// document shared with the warehouse team. They asked for pictures next to the
// field list so their engineers can see what each field feeds.
//
// This is a script rather than a folder of hand-taken screenshots for one
// reason: a screenshot document goes stale the moment the UI moves, and a stale
// picture is worse than no picture because it is believed. Re-run this after any
// visual change and republish.
//
//   npm run dev            # in another shell
//   node scripts/panel-shots.mjs
//   node scripts/panel-shots.mjs --only=awareness-heatmap    # one panel
//
// Output: scripts/.panel-shots/<slug>.jpg plus manifest.json (slug -> heading,
// route, persona, pixel size), which the document generator reads.
//
// Two storage keys are needed to reach any deep link, not one. Setting
// signed-in-user-id alone leaves demo-gate-passed unset, and AppLayout bounces
// the deep link back to '/', so every capture silently comes back empty.

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '.panel-shots');
const BASE = process.env.AUDIT_BASE ?? 'http://localhost:3000';
const BROWSER = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium';
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);

// Same resolution dance as contrast-audit.mjs: playwright is not a project
// dependency here, it is global.
async function loadChromium() {
  for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
    try {
      const mod = await import(spec);
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return chromium;
    } catch { /* try the next one */ }
  }
  throw new Error('Could not load playwright. Install it or set PLAYWRIGHT_CHROMIUM.');
}

/**
 * `heading` is matched against the first heading inside each card, trimmed and
 * whitespace-collapsed, by prefix. Panels with no heading of their own (KPI
 * bands, tables) use `selector` instead, optionally narrowed by:
 *   contains  pick the first match whose text contains this string
 *   maxH      ignore matches taller than this, to separate small tiles from
 *             the full-size cards that share their class
 *   group     mark the common parent, so a row of tiles becomes one image
 */
const PANELS = [
  // ── Campaign detail, Delivery ──
  { slug: 'campaign-kpi-band', user: 'u9', route: '/campaigns/46888', selector: '.glass-card', group: true,
    maxH: 200, title: 'Campaign header tiles' },
  { slug: 'delivery-timeline', user: 'u9', route: '/campaigns/46888', heading: 'Delivery timeline' },
  { slug: 'asset-performance', user: 'u9', route: '/campaigns/46888', heading: 'Asset performance' },
  { slug: 'publisher-performance', user: 'u9', route: '/campaigns/46888', heading: 'Publisher performance' },
  { slug: 'lead-quality', user: 'u9', route: '/campaigns/46888', heading: 'Lead quality' },

  // ── Campaign detail, Reach ──
  { slug: 'account-funnel', user: 'u9', route: '/campaigns/46888', tab: 'Reach', heading: 'Account engagement funnel' },
  { slug: 'awareness-heatmap', user: 'u9', route: '/campaigns/46888', tab: 'Reach', heading: 'Awareness by account and channel' },
  { slug: 'weekly-reach', user: 'u9', route: '/campaigns/46888', tab: 'Reach', heading: 'Weekly reach build-up' },
  { slug: 'unreached-accounts', user: 'u9', route: '/campaigns/46888', tab: 'Reach', heading: 'Still to reach' },
  { slug: 'icp-visitors', user: 'u9', route: '/campaigns/46888', tab: 'Reach', heading: 'ICP website visitors' },

  // ── Campaign detail, Audience ──
  { slug: 'seniority', user: 'u9', route: '/campaigns/46888', tab: 'Audience', heading: 'Seniority reached' },
  { slug: 'companies-reached', user: 'u9', route: '/campaigns/46888', tab: 'Audience', heading: 'Companies reached' },
  { slug: 'job-function', user: 'u9', route: '/campaigns/46888', tab: 'Audience', heading: 'Job function' },
  { slug: 'industry-mix', user: 'u9', route: '/campaigns/46888', tab: 'Audience', heading: 'Industry mix' },

  // ── Campaign detail, Advertising ──
  { slug: 'frequency', user: 'u9', route: '/campaigns/46888', tab: 'Advertising', heading: 'Impression frequency per account' },
  { slug: 'channel-overlap', user: 'u9', route: '/campaigns/46888', tab: 'Advertising', heading: 'Channel overlap' },
  { slug: 'channel-performance', user: 'u9', route: '/campaigns/46888', tab: 'Advertising', heading: 'Channel performance' },
  { slug: 'top-creative', user: 'u9', route: '/campaigns/46888', tab: 'Advertising', heading: 'Top creative on each channel' },
  { slug: 'syndication-influence', user: 'u9', route: '/campaigns/46888', tab: 'Advertising', heading: 'From syndication lead to engaged account' },
  { slug: 'campaign-crosswalk', user: 'u9', route: '/campaigns/46888', tab: 'Advertising', heading: 'Campaign crosswalk' },

  // ── Client pages ──
  { slug: 'dashboard-kpis', user: 'u9', route: '/dashboard', selector: '.glass-card',
    contains: 'leads delivered', title: 'Dashboard headline figures' },
  { slug: 'dashboard-campaigns', user: 'u9', route: '/dashboard', heading: 'Campaigns' },
  { slug: 'dashboard-next-moves', user: 'u9', route: '/dashboard', heading: 'Next moves' },
  { slug: 'leads-accounts', user: 'u9', route: '/leads', selector: 'table', title: 'Leads, Accounts lens' },
  { slug: 'leads-people', user: 'u9', route: '/leads', tab: 'People', selector: 'table', title: 'Leads, People lens' },
  { slug: 'priority-accounts', user: 'u9', route: '/priority-accounts', selector: 'table', title: 'Priority accounts' },
  { slug: 'reports-geo', user: 'u9', route: '/reports', heading: 'Geographic Distribution' },
  { slug: 'reports-industry', user: 'u9', route: '/reports', heading: 'Industry Distribution' },
  { slug: 'reports-title', user: 'u9', route: '/reports', heading: 'Title Distribution' },
  { slug: 'reports-size', user: 'u9', route: '/reports', heading: 'Company Size' },

  // ── Briefings (u9 only; these routes are gated to the UNION preview login) ──
  { slug: 'committee-strip', user: 'u9', route: '/leads/SR-1', heading: 'Buying committee' },
  { slug: 'contact-role', user: 'u9', route: '/leads/SR-1', heading: 'Role analysis' },
  { slug: 'contact-playbook', user: 'u9', route: '/leads/SR-1', heading: 'Talking points' },
  { slug: 'account-fit', user: 'u9', route: '/leads/account/lonza-ag', heading: 'Seller fit' },
  { slug: 'account-signals', user: 'u9', route: '/leads/account/lonza-ag', heading: 'Buying signals' },
  { slug: 'account-pain', user: 'u9', route: '/leads/account/lonza-ag', heading: 'Account pain points' },
  { slug: 'account-tech', user: 'u9', route: '/leads/account/lonza-ag', heading: 'Technology stack' },

  // ── Operations ──
  { slug: 'ops-connections', user: 'u10', route: '/ops-union', selector: '.kpi-card', group: true,
    title: 'Integration status' },
  { slug: 'ops-pipeline', user: 'u10', route: '/ops-union', heading: 'Up next' },
  { slug: 'ops-intake', user: 'u10', route: '/ops-union/intake', heading: '1 · Campaign & source' },
  { slug: 'ops-new-campaign', user: 'u10', route: '/ops-union/campaigns/new', heading: '1 · Campaign & client' },
  { slug: 'ops-commercials', user: 'u10', route: '/ops-union/campaigns/new', heading: '4 · Commercials' },
  { slug: 'reports-billing', user: 'u9', route: '/reports', heading: 'Billing Trend' },
];

const targets = only ? PANELS.filter(p => p.slug === only) : PANELS;
if (!targets.length) { console.error(`No panel matches --only=${only}`); process.exit(1); }

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const chromium = await loadChromium();
const browser = await chromium.launch({ executablePath: BROWSER });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
await ctx.route('**/*', route => {
  const u = route.request().url();
  route[u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:') ? 'continue' : 'abort']();
});
const page = await ctx.newPage();

// Wait for the DOM to stop changing. Three consecutive stable samples, for the
// same reason the contrast audit needs three: at two, a mid-mount lull reads as
// finished and late sections are captured half-drawn.
async function settle() {
  let last = -1, stable = 0;
  for (let i = 0; i < 60 && stable < 3; i++) {
    const n = await page.evaluate(() => document.querySelectorAll('*').length);
    stable = n === last ? stable + 1 : 0; last = n;
    await page.waitForTimeout(110);
  }
  // Charts animate in after mount; the settle above only watches node count.
  await page.waitForTimeout(700);
}

let currentKey = '';
const manifest = [];
const missing = [];

for (const p of targets) {
  const key = `${p.user}::${p.route}`;
  if (key !== currentKey) {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(u => {
      sessionStorage.setItem('signed-in-user-id', u);
      sessionStorage.setItem('demo-gate-passed', '1');
      localStorage.setItem('pulse-theme', 'light');
    }, p.user);
    currentKey = key;
  }
  await page.goto(BASE + p.route, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await settle();

  if (p.tab) {
    const tab = page.locator('[role="tab"]', { hasText: p.tab }).first();
    if (await tab.count()) { await tab.click(); await settle(); }
  }

  // Mark the target element in the page, then screenshot it by that marker.
  const found = await page.evaluate(({ heading, selector, group, contains, maxH }) => {
    document.querySelectorAll('[data-shot]').forEach(e => e.removeAttribute('data-shot'));
    const norm = s => (s ?? '').trim().replace(/\s+/g, ' ');

    if (selector) {
      const els = [...document.querySelectorAll(selector)].filter(e => {
        const r = e.getBoundingClientRect();
        if (r.width < 200 || r.height < 60) return false;
        if (maxH && r.height > maxH) return false;
        if (contains && !(e.textContent ?? '').includes(contains)) return false;
        return true;
      });
      if (!els.length) return null;
      if (!group) { els[0].setAttribute('data-shot', '1'); return true; }
      // Group: mark the common parent so the whole row of tiles is one image.
      let parent = els[0].parentElement;
      while (parent && [...parent.children].filter(c => els.includes(c)).length < Math.min(2, els.length)) {
        parent = parent.parentElement;
      }
      (parent ?? els[0]).setAttribute('data-shot', '1');
      return true;
    }

    for (const card of document.querySelectorAll('.glass-card, [class*="rounded-2xl"]')) {
      const h = card.querySelector('h1,h2,h3,h4');
      if (!h || !norm(h.textContent).startsWith(heading)) continue;
      const r = card.getBoundingClientRect();
      if (r.width < 200 || r.height < 60) continue;
      card.setAttribute('data-shot', '1');
      return true;
    }
    return null;
  }, { heading: p.heading, selector: p.selector, group: p.group, contains: p.contains, maxH: p.maxH });

  if (!found) {
    missing.push(p.slug);
    console.log(`  MISS  ${p.slug}  (${p.heading ?? p.selector} on ${p.route})`);
    continue;
  }

  const el = page.locator('[data-shot="1"]').first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  const box = await el.boundingBox();
  await el.screenshot({ path: join(OUT, `${p.slug}.jpg`), type: 'jpeg', quality: 88 });

  manifest.push({
    slug: p.slug,
    title: p.title ?? p.heading,
    route: p.route,
    persona: p.user,
    tab: p.tab ?? null,
    w: Math.round(box?.width ?? 0),
    h: Math.round(box?.height ?? 0),
  });
  console.log(`  ok    ${p.slug}  ${Math.round(box?.width ?? 0)}x${Math.round(box?.height ?? 0)}`);
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
await browser.close();

console.log(`\n${manifest.length} captured, ${missing.length} missed${missing.length ? ': ' + missing.join(', ') : ''}`);
process.exit(missing.length ? 1 : 0);

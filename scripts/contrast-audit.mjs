/**
 * Contrast audit — WCAG AA across the whole portal.
 *
 *   npm run dev                          # in one terminal
 *   npm run audit:contrast               # in another — the full sweep
 *   npm run audit:contrast -- --user=u9 --theme=dark --route=/campaigns
 *
 * Walks every route below for four personas in both themes, and for each piece
 * of text computes the real contrast ratio against its *composited* background
 * — glass cards are translucent, so the effective ground is a stack, not the
 * nearest background-color. Failures are grouped by colour pair, because the
 * useful output is "this token is wrong" rather than "these 200 nodes are".
 *
 * Thresholds are WCAG AA: 4.5:1 for body text, 3:1 for large (>=24px, or
 * >=18.66px bold). Icons, bars and dots are not text and are not checked here.
 *
 * Exits non-zero when anything fails, so it can gate a build if wanted.
 *
 * ── Why this is structured the way it is ────────────────────────────────────
 * The first version took ~7 minutes, which is long enough that you stop running
 * it, which defeats the point. Three things cost that time, none of them the
 * measurement itself:
 *
 *  1. Every external image request hung. The app pulls ~14 URLs from Unsplash
 *     and friends; the browser has no proxy configured, so each one sat there
 *     until it timed out. Aborting off-origin requests up front is the single
 *     biggest win, and it costs nothing here — an <img> is not text, and the
 *     background compositing below reads colours, never bitmaps.
 *  2. A fresh BrowserContext per route meant 36 browser setups and 36 throwaway
 *     navigations to seed sessionStorage. Storage survives same-origin
 *     navigation within a tab, so one context per (persona, theme) seeds once
 *     and then just walks its routes.
 *  3. A flat 2.1s of sleep per route. Polling until the DOM stops changing
 *     returns in ~200ms on a settled page and still waits when it needs to.
 *
 * Routes are grouped by (persona, theme) and the groups run concurrently.
 */
const BASE = process.env.AUDIT_BASE ?? 'http://127.0.0.1:3000';
const BROWSER = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium';
/** 4 is a good default on a 4-core box; the work is I/O-bound, not CPU-bound. */
const PARALLEL = Number(process.env.AUDIT_PARALLEL ?? 4);

/**
 * Playwright is not a dependency of this project — it is a dev-machine tool, and
 * adding it would put a browser download in everyone's install. Resolve it from
 * wherever it happens to live: a local devDependency, a global install, or an
 * explicit path.
 */
async function loadChromium() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    'playwright',
    '/opt/node22/lib/node_modules/playwright/index.js',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      // Playwright is CommonJS, so a dynamic import may surface its exports as
      // named or only under .default depending on how it was resolved.
      const mod = await import(candidate);
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return chromium;
    } catch { /* try the next candidate */ }
  }
  console.error(
    'Could not load playwright. Install it (npm i -D playwright) or point\n' +
    'PLAYWRIGHT_MODULE at an existing install.',
  );
  process.exit(2);
}

const ROUTES = [
  ['u9', '/dashboard'], ['u9', '/campaigns'], ['u9', '/campaigns/46888'],
  ['u9', '/leads'], ['u9', '/leads/SR-0'], ['u9', '/leads/account/lonza-ag'],
  ['u9', '/reports'], ['u9', '/account'], ['u9', '/support'],
  ['u9', '/priority-accounts'],
  ['u10', '/ops-union'], ['u10', '/ops-union/intake'],
  ['u10', '/priority-accounts'],
  ['u10', '/ops-union/campaigns/new'], ['u10', '/ops-union/campaigns/46888'],
  // /invoices and /documents are deliberately absent: both redirect while
  // BILLING_MODULES_IN_SCOPE is false, so walking them audited the dashboard
  // twice more under two route names it no longer reaches. Put them back with
  // the modules.
  ['u1', '/dashboard'], ['u1', '/leads'], ['u1', '/reports'],
  ['u2', '/dashboard/manager'], ['u2', '/internal/campaigns'],
];

// ── Scope flags ─────────────────────────────────────────────────────────────
// A three-line colour change does not need all 36 page-loads. Narrowing to the
// pages you touched turns the check into something you run while editing.
const flag = name => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const onlyUser = flag('user');
const onlyTheme = flag('theme');
const onlyRoute = flag('route');

const themes = ['light', 'dark'].filter(t => !onlyTheme || t === onlyTheme);
const routes = ROUTES.filter(([u, p]) =>
  (!onlyUser || u === onlyUser) && (!onlyRoute || p.includes(onlyRoute)));

if (!themes.length || !routes.length) {
  console.error('No routes match those filters.');
  process.exit(2);
}

/** Runs in the page. Kept self-contained so it can be pasted into devtools. */
const AUDIT = () => {
  const parse = c => {
    const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  // Source-over. Returning a:1 unconditionally here is a subtle and expensive
  // bug: two translucent layers of one hue then read as that hue at full
  // strength, which invents failures that do not exist on screen.
  const over = (fg, bg) => {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
      a,
    };
  };
  const lum = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (x, y) => {
    const a = lum(x), b = lum(y);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

  const effBg = el => {
    let acc = null;
    for (let node = el; node; node = node.parentElement) {
      const cs = getComputedStyle(node);
      let c = parse(cs.backgroundColor);
      if (cs.backgroundImage !== 'none' && (!c || c.a < 1)) {
        const m = cs.backgroundImage.match(/rgba?\([^)]+\)/);
        if (m) { const g = parse(m[0]); if (g) c = { ...g, a: 1 }; }
      }
      if (c && c.a > 0) acc = acc ? over(acc, c) : c;
      if (acc && acc.a >= 0.999) return acc;
    }
    const base = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    return acc ? over(acc, { ...base, a: 1 }) : { ...base, a: 1 };
  };

  const out = [];
  let checked = 0;
  document.querySelectorAll('body *').forEach(el => {
    if (el.children.length) return;
    const text = (el.textContent || '').trim();
    if (!text || text.length > 90) return;
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
    const fg = parse(cs.color);
    if (!fg) return;
    checked++;
    const bg = effBg(el);
    const composited = fg.a < 1 ? over(fg, bg) : fg;
    const cr = ratio(composited, bg);
    const size = parseFloat(cs.fontSize);
    const weight = +cs.fontWeight || 400;
    const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
    if (cr < need) {
      out.push({
        text: text.slice(0, 44), fg: hex(composited), bg: hex(bg),
        ratio: Math.round(cr * 100) / 100, need, size, weight,
      });
    }
  });
  // `checked` is the coverage number. A speed change that quietly measures
  // fewer nodes would turn into a silent PASS, so the count is reported rather
  // than trusted.
  return { checked, fails: out };
};

/**
 * Wait for the page to stop changing rather than for a fixed duration. Entrance
 * animations and lazy sections settle in a couple of frames; a flat sleep pays
 * the worst case on every route.
 */
const settle = page => page.evaluate(async () => {
  const count = () => document.querySelectorAll('body *').length;
  // Three consecutive equal samples, not two. Under parallel load a page can
  // sit still for one interval mid-mount, and two samples then read that lull
  // as "finished" — which silently drops a late section from the audit. The
  // floor and the sample width are what make repeat runs agree node-for-node.
  let last = -1, stable = 0;
  await new Promise(r => setTimeout(r, 300));
  for (let i = 0; i < 24 && stable < 3; i++) {
    await new Promise(r => setTimeout(r, 150));
    const n = count();
    stable = n === last ? stable + 1 : 0;
    last = n;
  }
});

const chromium = await loadChromium();
const browser = await chromium.launch({ executablePath: BROWSER });

// Group by (persona, theme): storage is seeded once per group and then survives
// every same-origin navigation inside it.
const groups = [];
for (const theme of themes) {
  for (const user of [...new Set(routes.map(r => r[0]))]) {
    const paths = routes.filter(r => r[0] === user).map(r => r[1]);
    if (paths.length) groups.push({ user, theme, paths });
  }
}

const all = [];
let checked = 0;
const started = Date.now();

async function runGroup({ user, theme, paths }) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  // Abort everything that is not the dev server. Without this the ~14 external
  // images hang on a box with no direct egress, and every route pays for it.
  await ctx.route('**/*', route => {
    const url = route.request().url();
    route[url.startsWith(BASE) || url.startsWith('data:') || url.startsWith('blob:')
      ? 'continue' : 'abort']();
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(([u, t]) => {
      sessionStorage.setItem('signed-in-user-id', u);
      sessionStorage.setItem('demo-gate-passed', '1');
      localStorage.setItem('pulse-theme', t);
    }, [user, theme]);

    for (const path of paths) {
      try {
        await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await settle(page);

        // Measure the landing view, then every other tab panel. Without this
        // the campaign pages are audited on their default tab only, which on
        // /campaigns/:id is one of four — the other three (Reach, Audience,
        // Advertising) carry most of the page's text and went unmeasured.
        //
        // Tab detection happens AFTER the first panel is measured, not before.
        // That ordering is the whole trick. Polling beforehand raced the React
        // mount: under parallel load the chrome settles while the tab strip is
        // still coming up, the poll read zero, and the run silently audited a
        // quarter of the page. It was reproducible — the same scoped run gave
        // 744 nodes normally and 4,200 with AUDIT_VERBOSE, because the extra
        // logging slowed it just enough for the tabs to appear. By the time the
        // first AUDIT returns, the page has demonstrably finished rendering, so
        // the count is trustworthy with no polling and no timeout.
        const measure = async (label) => {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await settle(page);
          await page.evaluate(() => window.scrollTo(0, 0));
          const res = await page.evaluate(AUDIT);
          const where = label ? `${path}#${label}` : path;
          if (process.env.AUDIT_VERBOSE) console.log(`COUNT ${user} ${theme} ${where} ${res.checked}`);
          checked += res.checked;
          return { res, where };
        };

        const first = await measure('');
        first.res.fails.forEach(f => all.push({ ...f, theme, user, path: first.where }));

        const tabs = await page.evaluate(() =>
          [...document.querySelectorAll('[role="tab"]')].map(t => (t.textContent ?? '').trim()));
        // Index 0 is the panel we just measured as the landing view.
        for (let i = 1; i < tabs.length; i++) {
          await page.evaluate(n => document.querySelectorAll('[role="tab"]')[n]?.click(), i);
          await settle(page);
          const { res, where } = await measure(tabs[i]);
          res.fails.forEach(f => all.push({ ...f, theme, user, path: where }));
        }
      } catch (err) {
        console.log(`  ! ${user} ${path} [${theme}] — ${String(err).slice(0, 70)}`);
      }
    }
  } catch (err) {
    console.log(`  ! ${user} [${theme}] setup — ${String(err).slice(0, 70)}`);
  }
  await ctx.close();
}

// Simple worker pool over the groups.
const queue = [...groups];
await Promise.all(
  Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
    for (let g = queue.shift(); g; g = queue.shift()) await runGroup(g);
  }),
);
await browser.close();

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
const scope = `${routes.length} route${routes.length === 1 ? '' : 's'} × ${themes.join('+')}, ${checked} text nodes`;

const byPair = new Map();
for (const f of all) {
  const key = `${f.fg} on ${f.bg}`;
  if (!byPair.has(key)) byPair.set(key, { n: 0, ratio: f.ratio, need: f.need, samples: new Set(), routes: new Set(), themes: new Set() });
  const e = byPair.get(key);
  e.n++; e.samples.add(f.text); e.routes.add(f.path); e.themes.add(f.theme);
}

if (all.length === 0) {
  console.log(`PASS — every text node meets WCAG AA across ${scope}.  (${elapsed}s)`);
  process.exit(0);
}
console.log(`FAIL — ${all.length} text nodes below AA, across ${byPair.size} colour pairs  (${scope}, ${elapsed}s)\n`);
for (const [pair, e] of [...byPair].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`${String(e.n).padStart(4)}×  ${pair}  ratio ${e.ratio} (needs ${e.need})  [${[...e.themes].join('+')}]`);
  console.log(`        e.g. "${[...e.samples].slice(0, 3).join('" / "')}"`);
  console.log(`        on: ${[...e.routes].slice(0, 4).join(', ')}${e.routes.size > 4 ? ` (+${e.routes.size - 4})` : ''}`);
}
process.exit(1);

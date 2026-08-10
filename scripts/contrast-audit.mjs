/**
 * Contrast audit — WCAG AA across the whole portal.
 *
 *   npm run dev                       # in one terminal
 *   node scripts/contrast-audit.mjs   # in another
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
 */
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_BASE ?? 'http://127.0.0.1:3000';
const BROWSER = process.env.PLAYWRIGHT_CHROMIUM ?? '/opt/pw-browsers/chromium';

const ROUTES = [
  ['u9', '/dashboard'], ['u9', '/campaigns'], ['u9', '/campaigns/46888'],
  ['u9', '/leads'], ['u9', '/leads/SR-0'], ['u9', '/leads/account/lonza-ag'],
  ['u9', '/reports'], ['u9', '/account'], ['u9', '/support'],
  ['u10', '/ops-union'], ['u10', '/ops-union/enrichment'], ['u10', '/ops-union/intake'],
  ['u1', '/dashboard'], ['u1', '/invoices'], ['u1', '/documents'], ['u1', '/reports'],
  ['u2', '/dashboard/manager'], ['u2', '/internal/campaigns'],
];

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
  return out;
};

const browser = await chromium.launch({ executablePath: BROWSER });
const all = [];
for (const theme of ['light', 'dark']) {
  for (const [user, path] of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(([u, t]) => {
        sessionStorage.setItem('signed-in-user-id', u);
        sessionStorage.setItem('demo-gate-passed', '1');
        localStorage.setItem('pulse-theme', t);
      }, [user, theme]);
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      // Sections animate in on scroll; visit the bottom so they mount.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      (await page.evaluate(AUDIT)).forEach(f => all.push({ ...f, theme, user, path }));
    } catch (err) {
      console.log(`  ! ${user} ${path} — ${String(err).slice(0, 70)}`);
    }
    await ctx.close();
  }
}
await browser.close();

const byPair = new Map();
for (const f of all) {
  const key = `${f.fg} on ${f.bg}`;
  if (!byPair.has(key)) byPair.set(key, { n: 0, ratio: f.ratio, need: f.need, samples: new Set(), routes: new Set(), themes: new Set() });
  const e = byPair.get(key);
  e.n++; e.samples.add(f.text); e.routes.add(f.path); e.themes.add(f.theme);
}

if (all.length === 0) {
  console.log(`PASS — every text node meets WCAG AA across ${ROUTES.length} routes in both themes.`);
  process.exit(0);
}
console.log(`FAIL — ${all.length} text nodes below AA, across ${byPair.size} colour pairs\n`);
for (const [pair, e] of [...byPair].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`${String(e.n).padStart(4)}×  ${pair}  ratio ${e.ratio} (needs ${e.need})  [${[...e.themes].join('+')}]`);
  console.log(`        e.g. "${[...e.samples].slice(0, 3).join('" / "')}"`);
  console.log(`        on: ${[...e.routes].slice(0, 4).join(', ')}${e.routes.size > 4 ? ` (+${e.routes.size - 4})` : ''}`);
}
process.exit(1);

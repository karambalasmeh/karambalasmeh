/**
 * Renders the profile card.
 *
 * The card is a hydrographic chart: contour lines, a neatline border, a position
 * fix, a legend and a scale bar. Work is plotted on it as numbered stations.
 *
 *   node tools/build.mjs
 *
 * Writes assets/card-dark.png and assets/card-light.png. Bump CARD_VERSION in
 * README.md afterwards or GitHub's camo proxy keeps serving the old bytes.
 */
import { chromium } from 'playwright';
import * as icons from 'simple-icons';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { me, builds, refusals, stack, stations, alsoRow, footer, links } from './data.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const SHOTS = path.join(ROOT, 'assets', 'shots');
const stats = JSON.parse(fs.readFileSync(path.join(HERE, 'stats.json'), 'utf8'));

/* ---------------------------------------------------------------- theme */
const THEMES = {
  dark: {
    bg: '#0A0A0B', panel: '#111011', sunk: '#0E0E0F',
    line: '#232120', line2: '#332F2A',
    sand: '#E7B269', sandDim: '#A87C42',
    ink: '#F0ECE5', dim: '#9A958C', faint: '#6B665E',
    shotEdge: '#ffffff12',
  },
  light: {
    bg: '#FAF9F7', panel: '#FFFFFF', sunk: '#F3F1EC',
    line: '#E2DED6', line2: '#CBC5B9',
    sand: '#8A5A16', sandDim: '#A9863F',
    ink: '#141310', dim: '#57534B', faint: '#8A857B',
    shotEdge: '#00000014',
  },
};

/* ------------------------------------------------------------- assets */
const dataUri = (f) => {
  const p = path.join(SHOTS, f);
  if (!fs.existsSync(p)) { console.warn('  missing shot:', f); return ''; }
  const ext = path.extname(f).slice(1);
  const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;
};

const EXTRA = {
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
};

function icon(slug, t) {
  if (EXTRA[slug]) return `<svg viewBox="0 0 24 24" fill="${t.ink}"><path d="${EXTRA[slug]}"/></svg>`;
  const key = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1);
  const ic = icons[key];
  if (!ic) { console.warn('  missing icon:', slug); return ''; }
  return `<svg viewBox="0 0 24 24" fill="${t.ink}"><path d="${ic.path}"/></svg>`;
}

/* --------------------------------------------------------- components */
const rule = (t, label) => `
  <div class="rule"><span class="rule-label">${label}</span><i></i></div>`;

function statBlock(t) {
  const max = Math.max(...stats.calendar.map(d => d.c), 1);
  const cells = stats.calendar.map(d => {
    const lv = d.c === 0 ? 0 : Math.min(4, Math.ceil((d.c / max) * 4));
    const op = [0.06, 0.28, 0.48, 0.70, 1][lv];
    return `<i style="background:${lv ? t.sand : t.line};opacity:${lv ? op : 1}"></i>`;
  }).join('');
  return `
  <div class="year">
    <div class="year-nums">
      ${[[stats.total.toLocaleString(), 'contributions in 2026'],
         [stats.active, 'active days'],
         [stats.streak, 'day longest streak'],
         [stats.repos, 'repositories']].map(([v, k]) =>
        `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('')}
    </div>
    <div class="cal">${cells}</div>
    <div class="langs">
      ${stats.langs.map(([n, p]) => `<div class="lang"><span>${n}</span>
        <div class="bar"><i style="width:${Math.max(p, 1.5)}%"></i></div><em>${p}%</em></div>`).join('')}
    </div>
    <p class="note">Share of code written across public and private repositories. Three repositories
      holding ~1.4 GB of generated and vendored HTML are excluded — including them reports this
      profile as 87% HTML, which would not be true of the work.</p>
  </div>`;
}

/* --------------------------------------------------------------- page */
// Rendered at 880px — the width GitHub actually gives a README on desktop — so
// type lands at its true size instead of being scaled down by a third.
const W = 880;

function html(theme) {
  const t = THEMES[theme];
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:${W}px;background:${t.bg};color:${t.ink};
       font-family:Archivo,system-ui,sans-serif;font-size:15px;line-height:1.6;
       -webkit-font-smoothing:antialiased}
  .card{position:relative;overflow:hidden;background:${t.bg}}
  .fix{font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:.16em;
       color:${t.sand};margin-bottom:16px}
  .fix s{text-decoration:none;color:${t.faint}}

  .inner{position:relative;z-index:3;padding:46px 34px 38px}

  /* ---- header ---- */
  h1{font-family:'Bricolage Grotesque',sans-serif;font-size:60px;font-weight:700;
     line-height:.95;letter-spacing:-.03em;margin-bottom:12px}
  .role{font-size:21px;font-weight:600;color:${t.sand};margin-bottom:12px}
  .lede{font-size:16.5px;line-height:1.6;color:${t.dim};max-width:62ch;margin-bottom:12px}
  .org{font-family:'IBM Plex Mono',monospace;font-size:13px;color:${t.dim}}

  /* title block, laid across the width rather than squeezed into a corner */
  .block{margin-top:26px;border:1px solid ${t.line2};background:${t.panel};
         padding:18px 22px;font-family:'IBM Plex Mono',monospace}
  .block dl{display:grid;grid-template-columns:repeat(4,1fr);gap:0 18px}
  .block dt{font-size:10.5px;letter-spacing:.16em;color:${t.faint};margin-bottom:5px}
  .block dd{font-size:14px;color:${t.ink}}
  .block .key{display:flex;gap:26px;flex-wrap:wrap;margin-top:16px;padding-top:14px;
              border-top:1px solid ${t.line};font-size:12px;color:${t.dim}}
  .block .key b{color:${t.sand};font-weight:400;margin-right:7px}

  /* ---- section rule ---- */
  .rule{display:flex;align-items:center;gap:16px;margin:40px 0 20px}
  .rule-label{font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:500;
              letter-spacing:.2em;color:${t.sand};white-space:nowrap}
  .rule i{flex:1;height:1px;background:${t.line2}}

  /* ---- what i build ---- */
  .build{display:grid;grid-template-columns:150px 1fr;gap:20px;align-items:baseline;
         padding:13px 0;border-bottom:1px solid ${t.line}}
  .build:first-child{border-top:1px solid ${t.line}}
  .build b{font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:500;
           letter-spacing:.11em;color:${t.ink}}
  .build b::before{content:'◆';color:${t.sand};margin-right:9px;font-size:8px;
                   position:relative;top:-2px}
  .build span{font-size:15.5px;color:${t.dim};line-height:1.5}

  /* ---- refusals ---- */
  .lead-in{font-size:16px;color:${t.dim};margin:-4px 0 20px;line-height:1.6;max-width:70ch}
  .refusals{display:grid;gap:12px}
  .ref{background:${t.sunk};border:1px solid ${t.line};border-left:2px solid ${t.sand};
       padding:18px 22px}
  .ref .top{display:flex;align-items:baseline;gap:14px;margin-bottom:8px}
  .ref .reading{font-family:'IBM Plex Mono',monospace;font-size:24px;font-weight:500;
                color:${t.sand};line-height:1}
  .ref h3{font-size:17px;font-weight:600}
  .ref p{font-size:15px;line-height:1.58;color:${t.dim}}

  /* ---- stack ---- */
  .sgroup{margin-bottom:20px}
  .sgroup > b{display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;
              letter-spacing:.18em;color:${t.faint};margin-bottom:12px}
  .icons{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}
  .ic{text-align:center}
  .ic .box{height:52px;border:1px solid ${t.line};background:${t.sunk};
           display:grid;place-items:center;margin-bottom:6px}
  .ic svg{width:22px;height:22px;opacity:.92}
  .ic span{display:block;font-family:'IBM Plex Mono',monospace;font-size:8.5px;
           letter-spacing:.05em;color:${t.faint}}

  /* ---- stations: one per row, so the screenshots are actually visible ---- */
  .stations{display:grid;gap:20px}
  .st{border:1px solid ${t.line};background:${t.sunk};overflow:hidden}
  .st .frame{background:${t.bg};border-bottom:1px solid ${t.line};
             height:330px;overflow:hidden}
  .st .frame img{width:100%;display:block}
  .st .body{padding:18px 22px 20px}
  .st .hd{display:flex;align-items:baseline;gap:12px;margin-bottom:4px}
  .st .n{font-family:'IBM Plex Mono',monospace;font-size:11px;color:${t.sand};
         letter-spacing:.09em}
  .st .n::before{content:'△ '}
  .st h3{font-family:'Bricolage Grotesque',sans-serif;font-size:22px;font-weight:600;
         letter-spacing:.01em}
  .st .kind{font-size:13px;color:${t.sand};margin-bottom:9px}
  .st p{font-size:15px;line-height:1.55;color:${t.dim};margin-bottom:11px}
  .st .tech{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:${t.faint}}

  .also{font-size:14.5px;line-height:1.7;color:${t.dim};border:1px solid ${t.line};
        border-left:2px solid ${t.sandDim};background:${t.sunk};padding:16px 20px;margin-top:20px}

  /* ---- this year ---- */
  .year-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
  .stat b{display:block;font-family:'Bricolage Grotesque',sans-serif;font-size:32px;
          font-weight:700;letter-spacing:-.025em;line-height:1;color:${t.ink}}
  .stat span{display:block;font-size:12px;color:${t.faint};margin-top:5px}
  .cal{display:grid;grid-template-rows:repeat(7,14px);grid-auto-flow:column;
       grid-auto-columns:14px;gap:3px;margin-bottom:24px;justify-content:start}
  .cal i{display:block;width:14px;height:14px;border-radius:2px}
  .langs{display:grid;grid-template-columns:1fr 1fr;gap:9px 30px;margin-bottom:16px}
  .lang{display:grid;grid-template-columns:110px 1fr 46px;gap:10px;align-items:center}
  .lang span{font-size:13px;color:${t.dim}}
  .lang em{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:${t.ink};
           font-style:normal;text-align:right}
  .lang .bar{height:5px;background:${t.line};overflow:hidden}
  .lang .bar i{display:block;height:100%;background:${t.sand}}
  .note{font-size:12.5px;line-height:1.6;color:${t.faint}}

  /* ---- footer ---- */
  footer{margin-top:34px;padding-top:18px;border-top:1px solid ${t.line2};
         display:grid;gap:6px;font-size:13px;color:${t.faint}}
  footer .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10.5px;
                  letter-spacing:.18em;color:${t.sandDim};margin-bottom:4px}
</style></head><body>
<div class="card">
  <div class="inner">
    <div class="fix">◇ ${me.coords} <s>/ ${me.place.toUpperCase()}</s></div>
    <h1>${me.name}</h1>
    <div class="role">${me.role}</div>
    <p class="lede">${me.lede}</p>
    <div class="org">${me.org}</div>

    <div class="block">
      <dl>
        <div><dt>SURVEYED</dt><dd>2022 — 2026</dd></div>
        <div><dt>STATIONS</dt><dd>${stations.length} plotted</dd></div>
        <div><dt>SOUNDINGS</dt><dd>${refusals.length} null</dd></div>
        <div><dt>DATUM</dt><dd>Evidence</dd></div>
      </dl>
      <div class="key">
        <span><b>△</b>station — work that shipped</span>
        <span><b>◆</b>capability</span>
        <span><b>—</b>null reading, recorded</span>
      </div>
    </div>

    ${rule(t, 'WHAT I BUILD')}
    ${builds.map(([k, v]) => `<div class="build"><b>${k}</b><span>${v}</span></div>`).join('')}

    ${rule(t, 'WHEN THE ANSWER IS NO')}
    <p class="lead-in">A model that cannot decline is not reporting a result, it is reporting a
      formality. Three times a system I built returned nothing, and said why.</p>
    <div class="refusals">
      ${refusals.map(r => `
        <div class="ref">
          <div class="top"><span class="reading">${r.reading}</span><h3>${r.title}</h3></div>
          <p>${r.line}</p>
        </div>`).join('')}
    </div>

    ${rule(t, 'STACK')}
    ${stack.map(g => `
      <div class="sgroup"><b>${g.group}</b>
        <div class="icons">
          ${g.items.map(([slug, label]) =>
            `<div class="ic"><div class="box">${icon(slug, t)}</div><span>${label.toUpperCase()}</span></div>`
          ).join('')}
        </div>
      </div>`).join('')}

    ${rule(t, 'SELECTED WORK')}
    <div class="stations">
      ${stations.map(s => `
        <div class="st">
          <div class="frame"><img src="${dataUri(s.shot)}" alt=""></div>
          <div class="body">
            <div class="hd"><span class="n">STATION ${s.n}</span><h3>${s.name}</h3></div>
            <div class="kind">${s.kind}</div>
            <p>${s.line}</p>
            <div class="tech">${s.stack}</div>
          </div>
        </div>`).join('')}
    </div>
    <div class="also">${alsoRow}</div>

    ${rule(t, 'THIS YEAR')}
    ${statBlock(t)}

    <footer>
      <div class="eyebrow">CHART NOTES</div>
      <div>${footer.edu}</div>
      <div>${footer.langs}</div>
      <div>Every screenshot on this card is a real interface from a project that runs.</div>
    </footer>
  </div>
</div>
</body></html>`;
}

/* --------------------------------------------------------------- run */
const browser = await chromium.launch();
for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: W, height: 1200 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html(theme), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  const out = path.join(ROOT, 'assets', `card-${theme}.png`);
  await page.locator('.card').screenshot({ path: out });
  const before = fs.statSync(out).size;
  // Palette-quantise. The card is a flat design with a handful of screenshots;
  // 256 colours with dithering is visually indistinguishable at ~1/3 the bytes,
  // which matters because GitHub proxies this image on every profile view.
  try {
    execFileSync('pngquant', ['--quality=70-94', '--speed', '1', '--force', '--output', out, out]);
  } catch { console.warn('  pngquant unavailable — shipping unoptimised PNG'); }
  const after = fs.statSync(out).size;
  console.log(`  card-${theme}.png  ${(after / 1024).toFixed(0)} KB  (from ${(before / 1024).toFixed(0)} KB)`);
  await ctx.close();
}
/* ---- link buttons -------------------------------------------------------
   The card is one image, and GitHub's camo proxy strips links from inside an
   image, so each link is its own small image wrapped in an <a> in the README. */
const linkHtml = (theme, l) => {
  const t = THEMES[theme];
  return `<!doctype html><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
  <style>
    *{margin:0;box-sizing:border-box}
    body{background:${t.bg}}
    .b{display:inline-flex;align-items:center;gap:11px;height:46px;padding:0 20px;
       border:1px solid ${t.line2};background:${t.panel};color:${t.ink};
       font-family:'IBM Plex Mono',monospace;font-size:12.5px;letter-spacing:.14em}
    .b svg{width:16px;height:16px;fill:${t.sand}}
  </style>
  <div class="b">${icon(l.icon, { ...t, ink: t.sand })}${l.label.toUpperCase()}</div>`;
};

for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const l of links) {
    await page.setContent(linkHtml(theme, l), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const out = path.join(ROOT, 'assets', `link-${l.id}-${theme}.png`);
    await page.locator('.b').screenshot({ path: out });
    try { execFileSync('pngquant', ['--quality=70-96', '--force', '--output', out, out]); } catch {}
  }
  await ctx.close();
}
console.log(`  ${links.length * 2} link buttons`);

await browser.close();
console.log('done');

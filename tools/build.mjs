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
    bg: '#06070E', panel: '#0B0D1A', sunk: '#090B15',
    line: '#1C2038', line2: '#2A3050',
    contour: 'rgba(231,178,105,.22)', contourHi: 'rgba(231,178,105,.55)',
    sand: '#E7B269', sandDim: '#B5854A',
    ink: '#EFEBE3', dim: '#9698AE', faint: '#5A5D78',
    shotEdge: '#ffffff14', grid: 'rgba(231,178,105,.07)',
  },
  light: {
    // chart paper: pale blue-grey stock, iron-gall ink, burnt-sienna contours
    bg: '#EAEEF2', panel: '#F7F9FB', sunk: '#E2E8EE',
    line: '#C2CEDA', line2: '#9BADBE',
    contour: 'rgba(150,98,28,.30)', contourHi: 'rgba(150,98,28,.62)',
    sand: '#8A5A16', sandDim: '#A97B3A',
    ink: '#0F1626', dim: '#46566B', faint: '#76879B',
    shotEdge: '#00000018', grid: 'rgba(60,90,120,.07)',
  },
};

/* ------------------------------------------------- contour line field */
// Nested isobaths. Each line is the one above it, pushed down and re-wobbled,
// so the field reads as terrain rather than as a stack of sine waves.
function contours({ w, h, lines = 22, seed = 7 }) {
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const out = [];
  const harmonics = Array.from({ length: 5 }, () => ({
    k: 0.6 + rnd() * 3.4, amp: 0.25 + rnd() * 1.0, phase: rnd() * Math.PI * 2,
  }));
  for (let i = 0; i < lines; i++) {
    const t = i / (lines - 1);
    const baseY = h * (0.10 + t * 0.95);
    const scale = 26 + 40 * Math.sin(t * Math.PI); // widest swing mid-field
    const pts = [];
    for (let x = -40; x <= w + 40; x += 11) {
      const u = x / w;
      let y = baseY;
      for (const hm of harmonics) {
        y += Math.sin(u * Math.PI * 2 * hm.k + hm.phase + t * 1.9) * hm.amp * scale;
      }
      y += Math.sin(u * Math.PI * 7.3 + t * 5) * 3.5; // fine roughness
      pts.push([x.toFixed(1), y.toFixed(1)]);
    }
    const d = pts.map((p, j) => (j ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    out.push({ d, major: i % 5 === 0 });
  }
  return out;
}

const contourSvg = (t, w, h, opts = {}) => `
<svg class="contours" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
  ${contours({ w, h, ...opts }).map(c =>
    `<path d="${c.d}" fill="none" stroke="${c.major ? t.contourHi : t.contour}" stroke-width="${c.major ? 1.5 : 1}"/>`
  ).join('')}
</svg>`;

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
function html(theme) {
  const t = THEMES[theme];
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1400px;background:${t.bg};color:${t.ink};
       font-family:Archivo,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .card{position:relative;overflow:hidden;
        background:
          linear-gradient(180deg, ${t.panel} 0%, ${t.bg} 420px, ${t.bg} 100%);
        background-color:${t.bg}}
  /* neatline: the double border a chart is printed inside */
  .neat{position:absolute;inset:14px;border:1px solid ${t.line2};pointer-events:none;z-index:5}
  .neat::before{content:'';position:absolute;inset:5px;border:1px solid ${t.line}}
  .grid{position:absolute;inset:0;z-index:0;
        background-image:linear-gradient(${t.grid} 1px,transparent 1px),
                         linear-gradient(90deg,${t.grid} 1px,transparent 1px);
        background-size:56px 56px}
  .field{position:absolute;top:0;left:0;right:0;height:560px;z-index:1;overflow:hidden;
         -webkit-mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 97%)}
  .contours{width:100%;height:100%;display:block}
  .inner{position:relative;z-index:3;padding:58px 64px 50px}

  /* ---- header ---- */
  header{position:relative;min-height:auto;padding-bottom:10px;
         display:grid;grid-template-columns:1fr 330px;gap:52px;align-items:start}
  .hgroup{padding-top:4px}
  .fix{display:flex;align-items:center;gap:14px;font-family:'IBM Plex Mono',monospace;
       font-size:13px;letter-spacing:.06em;color:${t.sand};margin-bottom:30px}
  .fix i{display:block;width:8px;height:8px;border:1.5px solid ${t.sand};
         transform:rotate(45deg)}
  .fix s{text-decoration:none;color:${t.faint}}
  h1{font-family:'Bricolage Grotesque',sans-serif;font-size:96px;font-weight:700;
     line-height:.9;letter-spacing:-.035em;margin-bottom:20px}
  .role{font-size:25px;font-weight:600;color:${t.sand};margin-bottom:14px}
  .lede{font-size:17.5px;line-height:1.62;color:${t.dim};max-width:64ch;margin-bottom:16px}
  .org{font-family:'IBM Plex Mono',monospace;font-size:13.5px;color:${t.dim}}

  /* scale bar, bottom-right of the header, as a chart prints one */
  /* the title block a chart prints in its corner */
  .block{border:1px solid ${t.line2};background:${t.panel}e6;padding:20px 22px;
         font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.07em;
         color:${t.faint};backdrop-filter:blur(2px)}
  .block h4{font-size:10.5px;letter-spacing:.2em;color:${t.sand};font-weight:500;
            margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid ${t.line}}
  .block dl{display:grid;grid-template-columns:auto 1fr;gap:7px 14px;margin-bottom:16px}
  .block dt{color:${t.faint}}
  .block dd{color:${t.ink};text-align:right}
  .block .key{display:grid;gap:6px;padding-top:13px;border-top:1px solid ${t.line};
              margin-bottom:15px}
  .block .key div{display:flex;gap:9px;align-items:center;color:${t.dim}}
  .block .key b{color:${t.sand};font-weight:400;width:12px;display:inline-block}
  .scale .bars{display:flex;margin-bottom:6px}
  .scale .bars i{width:30px;height:7px;border:1px solid ${t.sandDim}}
  .scale .bars i:nth-child(odd){background:${t.sandDim}}
  .scale{padding-top:13px;border-top:1px solid ${t.line}}

  /* ---- section rule ---- */
  .rule{display:flex;align-items:center;gap:20px;margin:46px 0 26px}
  .rule-label{font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:500;
              letter-spacing:.22em;color:${t.sand};white-space:nowrap}
  .rule i{flex:1;height:1px;background:${t.line2}}

  /* ---- what i build ---- */
  .builds{display:grid;gap:0}
  .build{display:grid;grid-template-columns:210px 1fr;gap:26px;align-items:baseline;
         padding:15px 0;border-bottom:1px solid ${t.line}}
  .build:first-child{border-top:1px solid ${t.line}}
  .build b{font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:500;
           letter-spacing:.14em;color:${t.ink}}
  .build b::before{content:'◆';color:${t.sand};margin-right:11px;font-size:9px;
                   position:relative;top:-2px}
  .build span{font-size:16px;color:${t.dim};line-height:1.5}

  /* ---- refusals: printed like depth soundings ---- */
  .refusals{display:grid;gap:14px}
  .ref{display:grid;grid-template-columns:186px 1fr;gap:30px;
       background:${t.sunk};border:1px solid ${t.line};border-left:2px solid ${t.sand};
       padding:24px 28px}
  .ref .reading{font-family:'IBM Plex Mono',monospace;font-size:31px;font-weight:500;
                color:${t.sand};line-height:1;letter-spacing:-.01em}
  .ref .depth{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:${t.faint};
              letter-spacing:.14em;margin-top:9px}
  .ref h3{font-size:18px;font-weight:600;margin-bottom:8px;letter-spacing:-.01em}
  .ref p{font-size:15.5px;line-height:1.6;color:${t.dim}}
  .lead-in{font-size:16.5px;color:${t.dim};max-width:78ch;margin:-8px 0 26px;line-height:1.6}

  /* ---- stack ---- */
  .sgroup{margin-bottom:24px}
  .sgroup > b{display:block;font-family:'IBM Plex Mono',monospace;font-size:11px;
              letter-spacing:.2em;color:${t.faint};margin-bottom:17px}
  .icons{display:grid;grid-template-columns:repeat(8,1fr);gap:16px}
  .ic{text-align:center}
  .ic .box{height:60px;border:1px solid ${t.line};background:${t.sunk};
           display:grid;place-items:center;margin-bottom:9px}
  .ic svg{width:26px;height:26px;opacity:.9}
  .ic span{display:block;font-family:'IBM Plex Mono',monospace;font-size:9.5px;
           letter-spacing:.08em;color:${t.faint}}

  /* ---- stations ---- */
  .stations{display:grid;grid-template-columns:1fr 1fr;gap:26px}
  .st{border:1px solid ${t.line};background:${t.sunk};overflow:hidden}
  .st.wide{grid-column:span 2}
  .st .frame{background:${t.bg};border-bottom:1px solid ${t.line};
             height:252px;overflow:hidden;position:relative}
  .st.wide .frame{height:330px}
  .st .frame img{width:100%;display:block;border-bottom:1px solid ${t.shotEdge}}
  .st .body{padding:22px 26px 25px}
  .st .hd{display:flex;align-items:baseline;gap:13px;margin-bottom:5px}
  .st .n{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:${t.sand};
         letter-spacing:.1em}
  .st .n::before{content:'△ ';font-size:10px}
  .st h3{font-family:'Bricolage Grotesque',sans-serif;font-size:23px;font-weight:600;
         letter-spacing:.015em}
  .st .kind{font-size:13px;color:${t.sand};margin-bottom:11px}
  .st p{font-size:15px;line-height:1.55;color:${t.dim};margin-bottom:13px}
  .st .tech{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:${t.faint};
            letter-spacing:.05em}

  .also{font-size:14.5px;line-height:1.75;color:${t.dim};border:1px solid ${t.line};
        border-left:2px solid ${t.sandDim};background:${t.sunk};padding:19px 24px;margin-top:24px}

  /* ---- this year ---- */
  .year-nums{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:26px}
  .stat b{display:block;font-family:'Bricolage Grotesque',sans-serif;font-size:38px;
          font-weight:700;letter-spacing:-.03em;line-height:1;color:${t.ink}}
  .stat span{display:block;font-size:12.5px;color:${t.faint};margin-top:7px}
  .cal{display:grid;grid-template-rows:repeat(7,20px);grid-auto-flow:column;
       grid-auto-columns:20px;gap:4px;margin-bottom:30px;justify-content:start}
  .cal i{display:block;width:20px;height:20px;border-radius:2px}
  .langs{display:grid;grid-template-columns:1fr 1fr;gap:11px 46px;margin-bottom:22px}
  .lang{display:grid;grid-template-columns:132px 1fr 52px;gap:14px;align-items:center}
  .lang span{font-size:13.5px;color:${t.dim}}
  .lang em{font-family:'IBM Plex Mono',monospace;font-size:12px;color:${t.ink};
           font-style:normal;text-align:right}
  .lang .bar{height:5px;background:${t.line};overflow:hidden}
  .lang .bar i{display:block;height:100%;background:${t.sand}}
  .note{font-size:12.5px;line-height:1.6;color:${t.faint};max-width:96ch}

  /* ---- footer ---- */
  footer{margin-top:52px;padding-top:24px;border-top:1px solid ${t.line2};
         display:grid;gap:7px;font-size:13.5px;color:${t.faint}}
  footer .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;
                  letter-spacing:.2em;color:${t.sandDim};margin-bottom:5px}
</style></head><body>
<div class="card">
  <div class="grid"></div>
  <div class="field">${contourSvg(t, 1400, 560, { lines: 20, seed: 11 })}</div>
  <div class="neat"></div>
  <div class="inner">

    <header>
      <div class="hgroup">
        <div class="fix"><i></i> ${me.coords} <s>/ ${me.place.toUpperCase()}</s></div>
        <h1>${me.name}</h1>
        <div class="role">${me.role}</div>
        <p class="lede">${me.lede}</p>
        <div class="org">${me.org}</div>
      </div>
      <div class="block">
        <h4>SHEET 01</h4>
        <dl>
          <dt>SURVEYED</dt><dd>2022 — 2026</dd>
          <dt>STATIONS</dt><dd>${stations.length} PLOTTED</dd>
          <dt>SOUNDINGS</dt><dd>${refusals.length} NULL</dd>
          <dt>DATUM</dt><dd>EVIDENCE</dd>
        </dl>
        <div class="key">
          <div><b>△</b> station — work that shipped</div>
          <div><b>◆</b> capability</div>
          <div><b>—</b> null reading, recorded</div>
        </div>
        <div class="scale">
          <div class="bars"><i></i><i></i><i></i><i></i></div>
          DEPTHS MEASURED, NOT ASSUMED
        </div>
      </div>
    </header>

    ${rule(t, 'WHAT I BUILD')}
    <div class="builds">
      ${builds.map(([k, v]) => `<div class="build"><b>${k}</b><span>${v}</span></div>`).join('')}
    </div>

    ${rule(t, 'WHEN THE ANSWER IS NO')}
    <p class="lead-in">A model that cannot decline is not reporting a result, it is reporting a
      formality. Three times a system I built returned nothing, and said why.</p>
    <div class="refusals">
      ${refusals.map(r => `
        <div class="ref">
          <div><div class="reading">${r.reading}</div><div class="depth">READING</div></div>
          <div><h3>${r.title}</h3><p>${r.line}</p></div>
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
        <div class="st${s.wide ? ' wide' : ''}">
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
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 2 });
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

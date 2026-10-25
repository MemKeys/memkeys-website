#!/usr/bin/env node
// gen-og.mjs — generate one OG/social-preview PNG per major page, built from
// the brand fact-card grammar (keyhole mark + keyed-fact card, locked palette,
// IBM Plex). Output: public/og/<slug>.png at 1200x630.
//
// Rendering is pure sharp + fontkitten (both already dependencies): the brand
// Plex woff2 is converted to glyph *paths* with fontkitten, so the SVG carries
// no <text> and needs no system font — sharp rasterizes it identically here
// and in CI (no headless browser / system-lib dependency).
//
// The PNGs are committed; re-run `node scripts/gen-og.mjs` when copy changes.
// Per-page og:image wiring lives in astro.config.mjs (ogImageIntegration).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { create } from 'fontkitten';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONT_DIR = path.join(ROOT, 'src/assets/fonts');
const OUT_DIR = path.join(ROOT, 'public/og');

const W = 1200;
const H = 630;

// Locked palette (brand kit rev3).
const INK = '#17356F';
const BLUE = '#3E6FD9';
const GOLD = '#F7C948';
const GROUND = '#0B1830';
const REVERSE = '#EAF1FF';

const fonts = {
  bold: create(await fs.readFile(path.join(FONT_DIR, 'IBMPlexSans-Bold.woff2'))),
  regular: create(
    await fs.readFile(path.join(FONT_DIR, 'IBMPlexSans-Regular.woff2')),
  ),
};

// Lay a single line of text out as SVG glyph paths, baseline at (x, y). Returns
// { width, svg }. Font units are y-up; the group flips with scale(s, -s).
function line(str, font, fontSize, color, { letterSpacing = 0 } = {}) {
  const s = fontSize / font.unitsPerEm;
  const lsUnits = letterSpacing / s;
  const glyphs = font.glyphsForString(str);
  let pen = 0;
  let paths = '';
  for (const g of glyphs) {
    const d = g.path && g.path.toSVG();
    if (d) paths += `<path transform="translate(${pen.toFixed(1)},0)" d="${d}"/>`;
    pen += g.advanceWidth + lsUnits;
  }
  const width = (pen - lsUnits) * s;
  return {
    width,
    svg: (x, y) =>
      `<g fill="${color}" transform="translate(${x},${y}) scale(${s},${(-s).toFixed(5)})">${paths}</g>`,
  };
}

function measure(str, font, fontSize) {
  const s = fontSize / font.unitsPerEm;
  let pen = 0;
  for (const g of font.glyphsForString(str)) pen += g.advanceWidth;
  return pen * s;
}

// Greedy word-wrap to a max pixel width; returns an array of lines.
function wrap(str, font, fontSize, maxWidth) {
  const words = str.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (measure(next, font, fontSize) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// The keyhole mark (src/assets/hero-mark.svg), reverse ring + gold keyhole.
const MARK = `<g transform="translate(80,68)"><svg x="0" y="0" width="84" height="84" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FA4F5"/><stop offset="1" stop-color="#A9C4FF"/></linearGradient></defs><path d="M50.5 43.2 A24 24 0 1 1 52.6 22.1" stroke="url(#g)" stroke-width="4.2" fill="none" stroke-linecap="round"/><path d="M50.5 43.2 C 61.5 45.5, 60.5 56.8, 45.5 53.2" stroke="url(#g)" stroke-width="4.2" fill="none" stroke-linecap="round"/><circle cx="32" cy="26.5" r="4.4" fill="${GOLD}"/><path d="M30.2 29.9 L33.8 29.9 L32.8 37 L31.2 37 Z" fill="${GOLD}"/></svg></g>`;

const PAGES = [
  {
    slug: 'home',
    kicker: 'KEYED MEMORY FOR AGENTS',
    title: 'Every fact has an address.',
    tagline:
      'An open-source, attribute-based memory server for AI agents — keyed and temporal, with graph + vector as derived views.',
  },
  {
    slug: 'why',
    kicker: 'WHY MEMKEYS',
    title: 'The keyed-first inversion.',
    tagline:
      'Store each fact by the keys that describe it; fetch it back by address. Deterministic reads — no embed-and-pray.',
  },
  {
    slug: 'quickstart',
    kicker: 'QUICKSTART',
    title: 'Store your first fact.',
    tagline:
      'One Postgres, one server, two commands — then a store then fetch round trip that shows the whole idea.',
  },
  {
    slug: 'what-is-memkeys',
    kicker: 'DOCS',
    title: 'What is MemKeys?',
    tagline:
      'Attribute-based memory for agents — the fact envelope, the contract, and how to run it.',
  },
  {
    slug: 'architecture',
    kicker: 'ARCHITECTURE',
    title: 'The fact envelope.',
    tagline:
      'Key extraction, derived views, the write pipeline — one Postgres, pluggable backends.',
  },
];

function svgFor(page) {
  // Wordmark next to the mark.
  const word = line('MemKeys', fonts.bold, 38, REVERSE);
  // Kicker (gold on dark ground is compliant — the contrast rule bars gold on
  // paper, not on the dark ground).
  const kicker = line(page.kicker, fonts.bold, 22, GOLD, { letterSpacing: 4 });
  // Title: wrap to the content width if long.
  const titleLines = wrap(page.title, fonts.bold, 76, 1040);
  const taglineLines = wrap(page.tagline, fonts.regular, 30, 940);

  let y = 300;
  let titleSvg = '';
  for (const t of titleLines) {
    titleSvg += line(t, fonts.bold, 76, REVERSE).svg(80, y);
    y += 86;
  }
  const titleBottom = y;

  let ty = titleBottom + 6;
  let taglineSvg = '';
  for (const t of taglineLines) {
    taglineSvg += line(t, fonts.regular, 30, '#C7D6F5').svg(80, ty);
    ty += 42;
  }

  // Keyed-fact card: entity chips + the one gold key dot. Chips flow left→
  // right from x=128 (the card starts at x=80, the gold dot sits at x=104).
  const cardY = 520;
  // [segment, gapAfterPx] — a key is followed by a tight gap, then its value,
  // then a wider gap before the next key.
  const segments = [
    [line('project', fonts.bold, 22, BLUE), 8],
    [line('demo', fonts.regular, 22, REVERSE), 22],
    [line('subject', fonts.bold, 22, BLUE), 8],
    [line('freeze', fonts.regular, 22, REVERSE), 0],
  ];
  let cx = 128;
  let chips = '';
  for (const [seg, gap] of segments) {
    chips += seg.svg(cx, cardY + 36);
    cx += seg.width + gap;
  }
  const cardWidth = cx - 128 + 48;
  const card =
    `<rect x="80" y="${cardY}" width="${cardWidth}" height="56" rx="16" fill="${INK}" fill-opacity="0.5" stroke="${BLUE}" stroke-opacity="0.45"/>` +
    `<circle cx="104" cy="${cardY + 28}" r="7" fill="${GOLD}"/>` +
    chips;

  const url = line('memkeys.github.io', fonts.regular, 24, '#8CA3CE');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <radialGradient id="glow1" cx="88%" cy="-8%" r="70%"><stop offset="0" stop-color="${BLUE}" stop-opacity="0.22"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></radialGradient>
  <radialGradient id="glow2" cx="-4%" cy="110%" r="70%"><stop offset="0" stop-color="${INK}" stop-opacity="0.55"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="${GROUND}"/>
<rect width="${W}" height="${H}" fill="url(#glow1)"/>
<rect width="${W}" height="${H}" fill="url(#glow2)"/>
${MARK}
${word.svg(178, 122)}
${kicker.svg(80, 240)}
${titleSvg}
${taglineSvg}
${card}
${url.svg(W - 80 - url.width, cardY + 36)}
</svg>`;
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const page of PAGES) {
  const svg = svgFor(page);
  const out = path.join(OUT_DIR, `${page.slug}.png`);
  const { info } = await sharp(Buffer.from(svg))
    .png()
    .toFile(out)
    .then(async (i) => ({ info: i }));
  // Self-check: exact OG dimensions, and a size floor that a blank card (no
  // glyphs rendered — e.g. a font-parse regression) would fall under.
  if (info.width !== W || info.height !== H) {
    throw new Error(`${page.slug}: wrong dimensions ${info.width}x${info.height}`);
  }
  if (info.size < 20000) {
    throw new Error(`${page.slug}: output ${info.size}B looks blank`);
  }
  console.log(`og: wrote public/og/${page.slug}.png (${info.width}x${info.height}, ${Math.round(info.size / 1024)}KB)`);
}

#!/usr/bin/env node
// check-mermaid.mjs — build-time Mermaid rendering guard.
//
// rehype-mermaid renders ```mermaid fences to inline SVG at build time via a
// headless Chromium. If the browser fails to launch (missing system deps,
// stale playwright cache), the failure is swallowed per-page: pages with
// mermaid blocks publish with an EMPTY body and the build still exits 0.
// This guard fails the build in that case: for every synced page whose
// source markdown contains a mermaid fence, the emitted HTML must contain
// a rendered mermaid SVG and must not have collapsed to an empty shell.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const SRC_DOCS = process.env.MEMKEYS_DOCS_DIR
  ? path.resolve(process.env.MEMKEYS_DOCS_DIR)
  : path.resolve(__dirname, '../.memkeys/docs');

// Markers present on mermaid-generated inline SVGs (rehype-mermaid).
const SVG_MARKER_RE = /aria-roledescription|class="mermaid"|<svg[^>]*mermaid/i;
// Marker expressive-code leaves when a mermaid fence fell through to
// syntax highlighting instead of being rendered as a diagram.
const UNRENDERED_RE = /data-language="mermaid"/i;

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, out)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

const srcFiles = (await walk(SRC_DOCS)).filter((f) => f.endsWith('.md'));
const withMermaid = [];
for (const f of srcFiles) {
  const body = await fs.readFile(f, 'utf8');
  if (/^```mermaid/m.test(body)) {
    withMermaid.push(path.basename(f, '.md'));
  }
}

const failures = [];
let checked = 0;
for (const slug of withMermaid) {
  const page = path.join(DIST, 'docs', slug, 'index.html');
  let html;
  try {
    html = await fs.readFile(page, 'utf8');
  } catch {
    // Not every docs/ file with mermaid is published (sync allowlist).
    continue;
  }
  checked += 1;
  const rendered = SVG_MARKER_RE.test(html);
  const fellThrough = UNRENDERED_RE.test(html);
  const bodyLen = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || ['', ''])[1]
    .replace(/<[^>]+>/g, '').trim().length;
  if (!rendered || fellThrough || bodyLen < 40) {
    failures.push(
      `  docs/${slug}/: rendered=${rendered} fellThrough=${fellThrough} bodyChars=${bodyLen}`,
    );
  }
}

if (checked === 0) {
  console.error(
    'check-mermaid: no published pages carry mermaid fences — nothing to verify (unexpected?).',
  );
  process.exit(1);
}
if (failures.length > 0) {
  console.error(
    `check-mermaid: FAILED — ${failures.length}/${checked} mermaid page(s) not rendered (browser launch failure produces empty pages silently):\n` +
      failures.join('\n'),
  );
  process.exit(1);
}
console.log(
  `check-mermaid: clean — ${checked} mermaid page(s) rendered to inline SVG.`,
);

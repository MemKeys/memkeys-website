#!/usr/bin/env node
// sync-docs.mjs — ingest the MemKeys/memkeys code repo's docs/ Markdown as this
// website's docs source of truth, so docs stay versioned with the code.
//
// The docs live in the *code* repo (MemKeys/memkeys), not here. CI performs a
// sparse checkout of that repo's docs/ tree into .memkeys/ (see the Pages
// workflow); for local dev, either clone it there or point MEMKEYS_DOCS_DIR /
// MEMKEYS_REPO at an existing checkout.
//
// Why a sync step (and not a direct glob loader over the docs dir)?
//   The engineering docs are authored as plain Markdown with no Starlight
//   frontmatter (no `title:`), so a raw docsLoader() glob would fail schema
//   validation. We copy each file into src/content/docs/ and inject the minimal
//   frontmatter Starlight needs, deriving the title from the first H1. Files
//   that already carry frontmatter (e.g. docs/guide/ from M1 · ISI-6397) are
//   passed through verbatim. The source of truth stays the code repo's docs/.
//
// Output under src/content/docs/ is git-ignored and regenerated on every
// `npm run dev` / `npm run build` (see predev/prebuild hooks in package.json).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Resolve the source docs/ directory, in priority order.
const SRC_DOCS = process.env.MEMKEYS_DOCS_DIR
  ? path.resolve(process.env.MEMKEYS_DOCS_DIR)
  : process.env.MEMKEYS_REPO
    ? path.join(path.resolve(process.env.MEMKEYS_REPO), 'docs')
    : path.join(PROJECT_ROOT, '.memkeys', 'docs');

// Ingested engineering docs land in a dedicated `reference/` subtree so they
// never collide with hand-authored site pages (e.g. index.mdx,
// what-is-memkeys.md, getting-started.md) that live directly under
// src/content/docs/. Only this subtree is generated / git-ignored / cleaned.
const OUT_DOCS = path.join(PROJECT_ROOT, 'src', 'content', 'docs', 'reference');
const EDIT_BASE = 'https://github.com/MemKeys/memkeys/edit/main/docs';

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// Wipe the generated reference/ subtree so deletions in docs/ propagate and
// stale pages never linger. Only this subtree is ours — hand-authored pages
// elsewhere under src/content/docs/ are never touched.
async function clean(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

function deriveTitle(body, relPath) {
  const match = body.match(/^#\s+(.+?)\s*$/m);
  if (match) return match[1].trim();
  const base = path.basename(relPath, '.md');
  return base.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripFirstH1(body, title) {
  // Drop the first H1 — Starlight renders the frontmatter title as the page H1,
  // so keeping the Markdown H1 would duplicate it.
  const lines = body.split('\n');
  const idx = lines.findIndex((l) => /^#\s+/.test(l));
  if (idx !== -1 && lines[idx].replace(/^#\s+/, '').trim() === title) {
    lines.splice(idx, 1);
    if (lines[idx] === '') lines.splice(idx, 1);
  }
  return lines.join('\n');
}

function yamlQuote(s) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function main() {
  try {
    await fs.access(SRC_DOCS);
  } catch {
    console.error(
      `sync-docs: docs source not found at ${SRC_DOCS}\n` +
        `  Provide it via a sparse checkout into .memkeys/ (see README / CI),\n` +
        `  or set MEMKEYS_DOCS_DIR / MEMKEYS_REPO to an existing checkout.`,
    );
    process.exit(1);
  }

  await fs.mkdir(OUT_DOCS, { recursive: true });
  await clean(OUT_DOCS);

  const files = await walk(SRC_DOCS);
  let count = 0;
  for (const file of files) {
    const rel = path.relative(SRC_DOCS, file); // e.g. adr/ADR-0001-....md
    const raw = await fs.readFile(file, 'utf8');
    const dest = path.join(OUT_DOCS, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });

    let out;
    if (raw.startsWith('---\n') || raw.startsWith('---\r\n')) {
      // Already authored with Starlight frontmatter (e.g. docs/guide/ from the
      // content milestone M1 · ISI-6397) — pass it through verbatim so we never
      // double-inject a frontmatter block.
      out = raw;
    } else {
      // Plain engineering Markdown — inject the minimal frontmatter Starlight
      // needs, deriving the title from the first H1. The slug nests the page
      // under /docs/ so the landing page (src/pages/index.astro, M5 · ISI-6479)
      // owns the site root.
      const title = deriveTitle(raw, rel);
      const body = stripFirstH1(raw, title);
      const slug = `docs/reference/${rel.replace(/\.md$/, '').replace(/\\/g, '/')}`;
      out =
        [
          '---',
          `title: ${yamlQuote(title)}`,
          `slug: ${slug}`,
          `editUrl: ${EDIT_BASE}/${rel}`,
          '---',
          '',
        ].join('\n') + body;
    }

    await fs.writeFile(dest, out, 'utf8');
    count += 1;
  }

  console.log(`sync-docs: ingested ${count} Markdown file(s) from ${SRC_DOCS} -> src/content/docs/reference/`);
}

main().catch((err) => {
  console.error('sync-docs failed:', err);
  process.exit(1);
});

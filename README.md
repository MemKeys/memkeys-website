# memkeys-website

The MemKeys documentation + landing site, built with [Astro](https://astro.build)
and [Starlight](https://starlight.astro.build). One property hosts both the docs
experience and the marketing landing page (ISI-6398 · plan §4 + §0 rev 2).

Published to **GitHub Pages** at <https://memkeys.github.io/memkeys-website/> and
republished on every merge to `main` (`.github/workflows/deploy.yml`). The domain
is deferred to `*.github.io` until `memkeys.dev` / `.io` is registered
(ISI-5919); override the `SITE` / `BASE` env vars when a custom domain lands.

## Content model

Starlight renders everything under `src/content/docs/`. There are two sources,
and they coexist without collision:

1. **Hand-authored site pages** — committed directly under `src/content/docs/`
   (e.g. `index.mdx` landing, and the end-user pages `what-is-memkeys.md`,
   `getting-started.md`, `crd-reference.md`, …). These are authored here with
   Starlight frontmatter (`title` / `description` / `sidebar.order`).
2. **Ingested engineering docs** — the code repo
   ([`MemKeys/memkeys`](https://github.com/MemKeys/memkeys)) `docs/` tree is the
   source of truth for deeper engineering/reference docs. They are **ingested at
   build time** into `src/content/docs/reference/` (git-ignored) so docs stay
   versioned with the code — never hand-edit `reference/`.

> **rev 2 note:** per ISI-6393 rev 2 the site lives in this dedicated repo while
> the code repo's `docs/` remains authored there and ingested at build time. The
> `reference/` subtree keeps that ingestion fully separate from the hand-authored
> pages, so neither clobbers the other. Which code-repo docs are surfaced (and
> the final sidebar/IA) is curated by the content (M1 · ISI-6397) and assemble
> (M5 · ISI-6402) milestones.

### How ingestion works

- **CI** sparse-checks-out `MemKeys/memkeys`'s `docs/` tree into `.memkeys/`.
- `scripts/sync-docs.mjs` copies that Markdown into `src/content/docs/reference/`,
  injecting the minimal Starlight frontmatter (`title` from the first `# H1`,
  plus an `editUrl` back to the real source file). Files already carrying
  frontmatter (e.g. `docs/guide/` from M1) pass through untouched.

### Local development

```bash
# Provide a docs checkout for ingestion — either:
git clone --filter=blob:none --no-checkout https://github.com/MemKeys/memkeys .memkeys
git -C .memkeys sparse-checkout set docs && git -C .memkeys checkout main
# …or point at an existing clone:  export MEMKEYS_REPO=/path/to/memkeys

npm install
npx playwright install chromium   # for build-time Mermaid rendering
npm run dev                       # runs sync-docs then astro dev on :4321
```

| Command           | Action                                                   |
| ----------------- | -------------------------------------------------------- |
| `npm run sync`    | Ingest the code repo's `docs/` → `src/content/docs/reference/` |
| `npm run dev`     | Sync, then start the dev server                          |
| `npm run build`   | Sync, then build the static site to `dist/`              |
| `npm run preview` | Preview the built `dist/` locally                        |
| `npm run check`   | Sync, then run `astro check` (type + content validation) |

## Diagrams (Mermaid + SVG)

Per the board standard (rev 3), diagrams are **Mermaid or saved SVG, never
ASCII**. Fenced ` ```mermaid ` blocks render to **inline SVG at build time** via
[`rehype-mermaid`](https://github.com/remcohaszing/rehype-mermaid) (Shiki is
configured to skip the `mermaid` language so the raw graph source reaches the
renderer). The renderer drives a headless Chromium, so CI runs
`npx playwright install --with-deps chromium`. Inline SVG embeds the diagram
directly in the HTML, so it serves correctly under the Pages base path. Saved
`.svg` assets in `public/` serve through the same base path.

## Design handoff

The landing visual/UX design (M4a · ISI-6399) is staged in
[`design/`](design/) — `mockup.html` is the layout source of truth, with the
hero/architecture/how-to SVGs in `design/assets/`. The assemble milestone
(M5 · ISI-6402) wires those assets and the landing copy (M4b · ISI-6400) into
the Astro landing. This scaffold ships a branded splash placeholder in the
meantime.

## Brand

Theme and assets come from the locked brand kit in the code repo
(`branding/_unpacked/memkeys-branding/`): palette in `src/styles/brand.css`,
logo lockups + hero mark in `src/assets/`, favicon + OG/social card in
`public/`. No new identity work.

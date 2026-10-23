# MemKeys website

The MemKeys documentation + landing site, built with [Astro](https://astro.build)
and [Starlight](https://starlight.astro.build). One property hosts both the
curated docs experience and the marketing pages (landing, Why MemKeys,
Quickstart) — the website-overhaul information architecture.

Published to **GitHub Pages** at <https://memkeys.github.io/memkeys-website/>
and republished on every merge to `main` (`.github/workflows/deploy.yml`).
Override the `SITE` / `BASE` env vars when a custom domain lands.

## Docs are sourced from the code repo

The engineering docs under the [`MemKeys/memkeys`](https://github.com/MemKeys/memkeys)
repo's [`docs/`](https://github.com/MemKeys/memkeys/tree/main/docs) tree are the
single source of truth. CI sparse-checkouts that tree into `.memkeys/` and
`scripts/sync-docs.mjs` ingests the **allowlisted** public set into
`src/content/docs/docs/` (git-ignored) at build time, injecting the minimal
Starlight frontmatter (`title` derived from the first `# H1`, plus an `editUrl`
back to the real source file). Everything else in the code repo's `docs/`
(internal process, CI, design, ADRs) is never published. **Edit the docs in the
code repo, not the generated copies.**

The hand-authored site pages — landing (`index.mdx`), `why.mdx`,
`quickstart.mdx` — live in this repo under `src/content/docs/`.

For local dev, point the sync at a code-repo checkout (or clone one into
`.memkeys/`):

```bash
MEMKEYS_REPO=../memkeys npm run dev
```

## Develop

| Command         | Action                                                     |
| --------------- | ---------------------------------------------------------- |
| `npm run dev`   | Sync, then start the dev server                            |
| `npm run build` | Sync, then build the static site to `dist/`                |
| `npm run preview` | Preview the built `dist/` locally                        |
| `npm run check` | Sync, then run `astro check` (type + content validation)   |

## Publication guard

Two build-time gates keep internal material off the public site:
`scripts/sync-docs.mjs` fails the build if any page in the publish set carries
an internal ticket id or internal tooling name, and `scripts/check-refs.mjs`
(the `postbuild` step) re-scans the emitted `dist/` HTML.

## Brand

Theme and assets come from the locked MemKeys brand kit: palette in
`src/styles/brand.css`, logo lockups + hero mark in `src/assets/`, favicon +
OG/social card in `public/`.

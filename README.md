# MemKeys website

The MemKeys documentation + landing site, built with [Astro](https://astro.build)
and [Starlight](https://starlight.astro.build). One property hosts both the docs
experience and the marketing landing page.

Published to **GitHub Pages** at <https://memkeys.github.io/memkeys-website/>
and republished on every merge to `main` (`.github/workflows/deploy.yml`). The
domain is deferred to `*.github.io` until `memkeys.dev` / `.io` is registered;
override `SITE` / `BASE` env vars when a custom domain lands.

## Docs are sourced from the code repo

The engineering docs under the [`MemKeys/memkeys`](https://github.com/MemKeys/memkeys)
repo's `docs/` tree are the single source of truth. CI sparse-checkouts that
tree into `.memkeys/` before building; locally, either do the same or point
`MEMKEYS_DOCS_DIR` / `MEMKEYS_REPO` at an existing checkout.
`scripts/sync-docs.mjs` ingests them into `src/content/docs/docs/` (git-ignored)
at dev/build time, injecting the minimal Starlight frontmatter (`title` derived
from the first `# H1`, plus an `editUrl` back to the real source file) and
rebasing absolute links from the code repo's Pages base (`/memkeys`) to this
site's base. **Edit the docs in the code repo, not the generated copies.**

### Publication boundary

Only the `PUBLIC_DOCS` allowlist in `scripts/sync-docs.mjs` is published —
everything else in the code repo's `docs/` (ADRs, CI notes, observability
planning, design notes, work products) stays internal. The hand-authored pages
(`index.mdx`, `why.mdx`, `quickstart.mdx`) are protected by the `KEEP` set. Two
build-time guards enforce the boundary:

- `scripts/sync-docs.mjs` fails the build if any page in the content set
  carries an internal ticket ref (`ISI-<digits>`) or the internal tooling name
  ("paperclip").
- `scripts/check-refs.mjs` (postbuild) re-scans the emitted `dist/` HTML for
  the same patterns as a second net.

## Develop

```bash
npm install
MEMKEYS_REPO=/path/to/memkeys npm run dev   # sync-docs then astro dev on :4321
```

| Command         | Action                                                     |
| --------------- | ---------------------------------------------------------- |
| `npm run sync`  | Ingest the code repo's `docs/` → `src/content/docs/docs/`  |
| `npm run dev`   | Sync, then start the dev server                            |
| `npm run build` | Sync, then build the static site to `dist/`                |
| `npm run preview` | Preview the built `dist/` locally                        |
| `npm run check` | Sync, then run `astro check` (type + content validation)   |

## Brand

Theme and assets come from the locked brand kit (see `design/` in this repo):
palette in `src/styles/brand.css`, logo lockups + hero mark in `src/assets/`,
favicon + OG/social card in `public/`.

# memkeys-website

Source for the [MemKeys](https://github.com/MemKeys/memkeys) documentation &
marketing site.

The end-user documentation set (the source of truth, Starlight-ready markdown with
`title` / `description` / `sidebar.order` frontmatter) lives under
[`src/content/docs/`](src/content/docs/):

| Page | File |
|---|---|
| Home / index | `src/content/docs/index.md` |
| What is MemKeys? | `src/content/docs/what-is-memkeys.md` |
| Architecture | `src/content/docs/architecture.md` |
| Getting started | `src/content/docs/getting-started.md` |
| CRD reference | `src/content/docs/crd-reference.md` |

> The **Astro + Starlight scaffold and CI** for this site are tracked separately
> (ISI-6398); this repo currently holds only the content markdown. Links that point
> at files in the code repo (`charts/`, `deploy/`, `operator/`, `docs/`, `frontend/`)
> are absolute `github.com/MemKeys/memkeys` URLs so they resolve from here.

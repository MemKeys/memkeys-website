// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';

// GitHub Pages project-page deployment for MemKeys/memkeys-website:
//   https://memkeys.github.io/memkeys-website/
// Domain deferred to *.github.io until memkeys.dev/.io is registered (ISI-5919).
// Override via the SITE / BASE env vars when a custom domain lands.
const site = process.env.SITE ?? 'https://memkeys.github.io';
const base = process.env.BASE ?? '/memkeys-website';
const ogImage = `${site}${base.replace(/\/$/, '')}/og.png`;

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  // Board standard (rev 3): diagrams are Mermaid or saved SVG, never ASCII.
  // Render fenced ```mermaid blocks to inline SVG at build time. Shiki is told
  // to skip the `mermaid` language so rehype-mermaid sees the raw graph source;
  // inline-svg embeds the result directly, so it serves under any base path.
  // The CI build installs a headless Chromium (npx playwright install chromium)
  // that rehype-mermaid drives to lay out the diagrams.
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg' }]],
  },
  integrations: [
    starlight({
      title: 'MemKeys',
      description:
        'The attribute-based memory server for agents — facts keyed by attributes, temporal validity, graph + vector as derived views.',
      logo: {
        light: './src/assets/lockup.svg',
        dark: './src/assets/lockup-reverse.svg',
        replacesTitle: true,
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/brand.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/MemKeys/memkeys' },
      ],
      // Brand OG / social-preview card (branding/_unpacked/memkeys-branding/kit).
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: ogImage } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: ogImage } },
      ],
      // Sidebar is left to Starlight's automatic generation from the ingested
      // docs/ tree for now. The content milestone (M1 · ISI-6397) curates the
      // final information architecture; the assemble milestone (M5 · ISI-6402)
      // wires the landing + nav. Edit links are set per-page in sync-docs.mjs
      // so they point at the real source file in MemKeys/memkeys.
    }),
  ],
});

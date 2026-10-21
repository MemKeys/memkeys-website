import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// The docs collection is populated by scripts/sync-docs.mjs, which ingests the
// MemKeys/memkeys code repo's docs/ tree into src/content/docs/ (git-ignored)
// so that docs stay versioned with the code, in one place: the code repo.
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};

// Developer-curated seed profiles. Always available to all users, cannot be deleted.
// Files live in /public/influencers/ and are served as static assets.
//
// Workflow to update seeds:
//   1. Drop new high-res JPGs into public/influencers/ as {name}_raw.jpg
//   2. Run `node scripts/compress-seeds.mjs` to compress to {name}.jpg
//   3. Update the SEED_INFLUENCERS array below if names change

export const SEED_INFLUENCERS = [
  { id: 'jiho', name: 'jiho', gender: 'male',   faceUrl: '/influencers/jiho.jpg' },
  { id: 'min',  name: 'min',  gender: 'female', faceUrl: '/influencers/min.jpg' },
  { id: 'pang', name: 'pang', gender: 'male',   faceUrl: '/influencers/pang.jpg' },
  { id: 'ryo',  name: 'ryo',  gender: 'female', faceUrl: '/influencers/ryo.jpg' },
]

// Flag used by the UI to render seeds with a different style and hide the delete button.
export const isSeedInfluencer = (inf) => SEED_INFLUENCERS.some((s) => s.id === inf?.id)

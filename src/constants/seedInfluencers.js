// Developer-curated seed profiles. Always available to all users, cannot be deleted.
// Files live in /public/influencers/ and are served as static assets.
//
// To add a new seed: drop the JPG into public/influencers/ and add an entry below.

export const SEED_INFLUENCERS = [
  { id: 'm1', name: 'm1', gender: 'male',   faceUrl: '/influencers/m1.jpg' },
  { id: 'w1', name: 'w1', gender: 'female', faceUrl: '/influencers/w1.jpg' },
  { id: 'm2', name: 'm2', gender: 'male',   faceUrl: '/influencers/m2.jpg' },
  { id: 'w2', name: 'w2', gender: 'female', faceUrl: '/influencers/w2.jpg' },
]

// Flag used by the UI to render seeds with a different style and hide the delete button.
export const isSeedInfluencer = (inf) => SEED_INFLUENCERS.some((s) => s.id === inf?.id)

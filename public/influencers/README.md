# Seed Influencer Profiles

These files are served as static assets at `/influencers/{name}.jpg` at runtime.

Required files (referenced from `src/constants/seedInfluencers.js`):

| File | Identity | Default name shown in UI |
|---|---|---|
| `m1.jpg` | Korean male, short black hair, white tee | m1 |
| `w1.jpg` | Korean female, medium straight hair, navy sweatshirt | w1 |
| `m2.jpg` | Korean male, longer wet-look hair, white tee, earrings | m2 |
| `w2.jpg` | Korean female, mid-length wavy hair, beige tee | w2 |

Recommended specs:
- JPG, 4:5 portrait orientation
- ~1024px on the long side (kept small to ship quickly)
- Clean face photo, neutral expression, plain background works best

After dropping new files here, run `npm run build` (Vercel auto-deploys on push).

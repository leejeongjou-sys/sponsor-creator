# Seed Influencer Profiles

These files are served as static assets at `/influencers/{name}.jpg` at runtime.

Current seed roster (defined in `src/constants/seedInfluencers.js`):

| File | Name | Gender |
|---|---|---|
| `jiho.jpg` | jiho | male |
| `min.jpg`  | min  | female |
| `pang.jpg` | pang | male |
| `ryo.jpg`  | ryo  | female |

## Adding or replacing a seed

1. Drop the high-res original into this folder as `{name}_raw.jpg`
2. Install sharp if needed: `npm install --no-save sharp`
3. Run `node scripts/compress-seeds.mjs` to produce `{name}.jpg` (~100 KB, 1024px wide)
4. Delete the `*_raw.jpg` files (they're gitignored anyway — they should never be committed)
5. If renaming or adding entries, update `src/constants/seedInfluencers.js`
6. Commit + push → Vercel auto-deploys

Specs: JPG, 4:5 portrait or close. Plain background, neutral expression works best.

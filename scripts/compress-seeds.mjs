// One-off helper: download original seed influencer photos from the source
// server, compress them (1024px wide max, JPEG q85 mozjpeg), and write to
// public/influencers/. Re-run any time the upstream images change.
//
// Usage:  node scripts/compress-seeds.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'public', 'influencers')

const names = ['jiho', 'min', 'pang', 'ryo']

for (const name of names) {
  const rawPath = path.join(OUT_DIR, `${name}_raw.jpg`)
  if (!existsSync(rawPath)) {
    console.log(`skip ${name}: no raw at ${rawPath}`)
    continue
  }
  const buf = readFileSync(rawPath)
  const out = await sharp(buf)
    .resize({ width: 1024, withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
  const outPath = path.join(OUT_DIR, `${name}.jpg`)
  writeFileSync(outPath, out)
  console.log(`${name}.jpg: ${(out.length / 1024).toFixed(0)} KB`)
}

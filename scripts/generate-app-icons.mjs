import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const svgPath = path.join(root, 'lib/brand/app-icon.svg')
const svg = fs.readFileSync(svgPath, 'utf8')

async function renderIcon(size, outPath, paddingRatio = 0.12) {
  const pad = Math.round(size * paddingRatio)
  const inner = size - pad * 2

  const icon = await sharp(Buffer.from(svg)).resize(inner, inner, { fit: 'contain' }).png().toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: icon, top: pad, left: pad }])
    .png()
    .toFile(outPath)

  console.log('wrote', path.relative(root, outPath))
}

await renderIcon(32, path.join(root, 'app/icon.png'))
await renderIcon(180, path.join(root, 'app/apple-icon.png'))
await renderIcon(180, path.join(root, 'public/apple-icon.png'))
await renderIcon(192, path.join(root, 'public/icon-192.png'))
await renderIcon(512, path.join(root, 'public/icon-512.png'))

const logoSource = path.join(root, 'logoedunation.png')
const logoDest = path.join(root, 'public/logo.png')
if (fs.existsSync(logoSource)) {
  fs.copyFileSync(logoSource, logoDest)
  console.log('wrote public/logo.png')
}

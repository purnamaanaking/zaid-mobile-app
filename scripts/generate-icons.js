const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

async function main() {
  await generateIcon();
}

async function generateIcon() {
  const svgPath = path.resolve(__dirname, '..', 'assets', 'brand', 'zaid-icon.svg');
  const brandDir = path.resolve(__dirname, '..', 'assets', 'brand');
  const imagesDir = path.resolve(__dirname, '..', 'assets', 'images');

  const svgContent = fs.readFileSync(svgPath, 'utf-8');

  const base64Match = svgContent.match(/xlink:href="([^"]+)"/);
  if (!base64Match) {
    console.log('Could not find base64 image data in SVG, trying PNG source...');
    return generateFromPng();
  }

  const raw = base64Match[1];
  const prefix = 'data:image/png;base64,';
  if (!raw.startsWith(prefix)) {
    console.log('Unexpected data URI format, trying PNG source...');
    return generateFromPng();
  }

  const base64Data = raw.slice(prefix.length);
  const pngBuffer = Buffer.from(base64Data, 'base64');
  const sourcePath = path.join(brandDir, '_source_icon.png');
  fs.writeFileSync(sourcePath, pngBuffer);
  console.log('Extracted source icon:', pngBuffer.length, 'bytes');

  await generateIconsFromBuffer(sourcePath, brandDir, imagesDir);
  fs.unlinkSync(sourcePath);
}

async function generateFromPng() {
  const brandDir = path.resolve(__dirname, '..', 'assets', 'brand');
  const imagesDir = path.resolve(__dirname, '..', 'assets', 'images');
  const sourcePath = path.join(brandDir, 'zaid-icon.png');
  await generateIconsFromBuffer(sourcePath, brandDir, imagesDir);
}

async function generateIconsFromBuffer(sourcePath, brandDir, imagesDir) {
  const meta = await sharp(sourcePath).metadata();
  console.log('Source dimensions:', meta.width, 'x', meta.height);

  const size = Math.max(meta.width, meta.height);
  const padded = await sharp(sourcePath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const ICON_SIZE = 1024;
  const SAFE_RATIO = 0.6667;
  const safeContentSize = Math.round(ICON_SIZE * SAFE_RATIO);

  const baseIcon = await sharp(padded)
    .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const baseIconPath = path.join(brandDir, 'zaid-icon.png');
  fs.writeFileSync(baseIconPath, baseIcon);
  console.log('Generated main icon (1024x1024):', baseIconPath);

  const innerIcon = await sharp(padded)
    .resize(safeContentSize, safeContentSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.round((ICON_SIZE - safeContentSize) / 2),
      bottom: Math.round((ICON_SIZE - safeContentSize) / 2),
      left: Math.round((ICON_SIZE - safeContentSize) / 2),
      right: Math.round((ICON_SIZE - safeContentSize) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const foregroundPath = path.join(imagesDir, 'android-icon-foreground.png');
  fs.writeFileSync(foregroundPath, innerIcon);
  console.log('Generated foreground icon:', foregroundPath);

  const monoIcon = await sharp(baseIcon)
    .greyscale()
    .linear(3, -2)
    .threshold(128)
    .png()
    .toBuffer();

  const monoPath = path.join(imagesDir, 'android-icon-monochrome.png');
  fs.writeFileSync(monoPath, monoIcon);
  console.log('Generated monochrome icon:', monoPath);

  const bgBuffer = await sharp({
    create: { width: ICON_SIZE, height: ICON_SIZE, channels: 4, background: { r: 0x16, g: 0x0D, b: 0x20, alpha: 1 } },
  })
    .png()
    .toBuffer();
  const bgPath = path.join(imagesDir, 'android-icon-background.png');
  fs.writeFileSync(bgPath, bgBuffer);
  console.log('Generated background icon:', bgPath);

  const splashIcon = await sharp(baseIcon)
    .resize(200, undefined, { fit: 'inside' })
    .png()
    .toBuffer();

  const splashPath = path.join(imagesDir, 'splash-icon.png');
  fs.writeFileSync(splashPath, splashIcon);
  console.log('Generated splash icon:', splashPath);

  const favicon = await sharp(baseIcon)
    .resize(48, 48)
    .png()
    .toBuffer();

  const favPath = path.join(imagesDir, 'favicon.png');
  fs.writeFileSync(favPath, favicon);
  console.log('Generated favicon:', favPath);

  console.log('\nAll icons generated successfully!');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

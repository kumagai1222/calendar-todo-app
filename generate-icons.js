const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'chrome-extension/icons/icon.svg');
const outputDir = path.join(__dirname, 'chrome-extension/icons');

const sizes = [16, 48, 128];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated: icon${size}.png`);
  }

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);

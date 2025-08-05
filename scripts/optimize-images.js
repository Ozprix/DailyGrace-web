const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const OUTPUT_DIR = path.join(__dirname, '../public/icons/optimized');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Image sizes for different use cases
const sizes = [
  { width: 16, height: 16, name: 'favicon' },
  { width: 32, height: 32, name: 'favicon-32' },
  { width: 180, height: 180, name: 'icon-180' },
  { width: 192, height: 192, name: 'icon-192' },
  { width: 512, height: 512, name: 'icon-512' },
];

async function optimizeImage(inputPath, outputPath, width, height) {
  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .webp({ quality: 85 })
      .toFile(outputPath.replace('.png', '.webp'));
    
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .avif({ quality: 85 })
      .toFile(outputPath.replace('.png', '.avif'));
    
    console.log(`✅ Optimized ${path.basename(inputPath)} to ${width}x${height}`);
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error);
  }
}

async function optimizeAllImages() {
  const files = fs.readdirSync(ICONS_DIR).filter(file => 
    file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
  );

  console.log('🔄 Starting image optimization...');

  for (const file of files) {
    const inputPath = path.join(ICONS_DIR, file);
    
    for (const size of sizes) {
      const outputPath = path.join(OUTPUT_DIR, `${size.name}-${file}`);
      await optimizeImage(inputPath, outputPath, size.width, size.height);
    }
  }

  console.log('✅ Image optimization complete!');
  console.log(`📁 Optimized images saved to: ${OUTPUT_DIR}`);
}

// Run the optimization
optimizeAllImages().catch(console.error); 
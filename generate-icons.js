const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('Error: sharp package is not installed.');
  console.log('Please install it with: npm install sharp');
  process.exit(1);
}

// Icon sizes for Android
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// iOS icon sizes
const iosSizes = [
  { size: 20, scales: [2, 3], idiom: 'iphone' },
  { size: 29, scales: [2, 3], idiom: 'iphone' },
  { size: 40, scales: [2, 3], idiom: 'iphone' },
  { size: 60, scales: [2, 3], idiom: 'iphone' },
  { size: 1024, scales: [1], idiom: 'ios-marketing' }
];

const inputImage = 'src/assets/images/icon.png';
const androidResPath = 'android/app/src/main/res';
const iosIconPath = 'ios/PaymintOwner/Images.xcassets/AppIcon.appiconset';

async function generateIcons() {
  // Check if input image exists
  if (!fs.existsSync(inputImage)) {
    console.error(`Error: ${inputImage} not found.`);
    console.log('Please ensure icon.png exists at src/assets/images/icon.png');
    process.exit(1);
  }

  console.log('App Icon Generator');
  console.log('==================\n');
  console.log(`Input image: ${inputImage}\n`);

  // Generate Android icons
  console.log('Generating Android icons...');
  for (const [folder, size] of Object.entries(sizes)) {
    const outputDir = path.join(androidResPath, folder);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, 'ic_launcher.png');
    const outputFileRound = path.join(outputDir, 'ic_launcher_round.png');

    try {
      // Generate square icon
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputFile);

      // Generate round icon
      await sharp(inputImage)
        .resize(size, size, {
          fit: 'cover',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputFileRound);

      console.log(`✓ Generated ${folder}: ${size}x${size}px`);
    } catch (error) {
      console.error(`✗ Error generating ${folder}:`, error.message);
    }
  }

  // Generate iOS icons
  console.log('\nGenerating iOS icons...');
  
  // Create iOS icon directory if it doesn't exist
  if (!fs.existsSync(iosIconPath)) {
    fs.mkdirSync(iosIconPath, { recursive: true });
  }

  const contentsJson = {
    images: [],
    info: {
      author: 'xcode',
      version: 1
    }
  };

  for (const { size, scales, idiom } of iosSizes) {
    for (const scale of scales) {
      const pixelSize = size * scale;
      const filename = `icon-${size}@${scale}x.png`;
      const outputFile = path.join(iosIconPath, filename);

      try {
        await sharp(inputImage)
          .resize(pixelSize, pixelSize, {
            fit: 'cover',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png()
          .toFile(outputFile);

        contentsJson.images.push({
          filename: filename,
          idiom: idiom,
          scale: `${scale}x`,
          size: `${size}x${size}`
        });

        console.log(`✓ Generated iOS icon: ${pixelSize}x${pixelSize}px (${size}@${scale}x)`);
      } catch (error) {
        console.error(`✗ Error generating iOS icon ${size}@${scale}x:`, error.message);
      }
    }
  }

  // Write Contents.json for iOS
  const contentsJsonPath = path.join(iosIconPath, 'Contents.json');
  fs.writeFileSync(contentsJsonPath, JSON.stringify(contentsJson, null, 2));
  console.log('✓ Generated Contents.json for iOS');

  console.log('\n✓ All icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. For Android: Rebuild your app with: cd android && ./gradlew clean');
  console.log('2. For iOS: Open Xcode and rebuild your app');
}

generateIcons().catch(console.error);

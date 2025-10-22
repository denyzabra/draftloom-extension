const fs = require('fs');
const path = require('path');

// Simple SVG icon for DraftLoom
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667EEA;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764BA2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}"
        font-weight="bold" fill="white" text-anchor="middle"
        dominant-baseline="central">DL</text>
</svg>
`;

const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filePath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filePath, svg.trim());
  console.log(`✓ Created icon${size}.svg`);
});

console.log('\n📝 SVG icons created successfully!');
console.log('Note: For production, convert these to PNG using a tool like:');
console.log('  - https://cloudconvert.com/svg-to-png');
console.log('  - or install sharp: npm install sharp');

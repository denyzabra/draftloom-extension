/**
 * Generate placeholder icons for the Chrome extension
 * This creates simple colored PNG files using Canvas
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let Canvas;
try {
    Canvas = require('canvas');
} catch (error) {
    console.log('⚠️  canvas module not available. Creating a workaround...');
    console.log('Installing canvas: npm install canvas --save-dev');
    process.exit(1);
}

const { createCanvas } = Canvas;

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 48, 128];
const colors = {
    background: '#4A90E2', // Blue background
    text: '#FFFFFF',       // White text
};

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, size, size);

    // Draw border
    ctx.strokeStyle = '#357ABD';
    ctx.lineWidth = Math.max(1, size / 32);
    ctx.strokeRect(0, 0, size, size);

    // Draw "DL" text (DraftLoom)
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${size * 0.5}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DL', size / 2, size / 2);

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(iconsDir, `icon${size}.png`);
    fs.writeFileSync(filePath, buffer);

    console.log(`✅ Generated icon${size}.png`);
}

// Generate all icon sizes
sizes.forEach(size => {
    try {
        generateIcon(size);
    } catch (error) {
        console.error(`❌ Failed to generate ${size}px icon:`, error.message);
    }
});

console.log('🎉 All icons generated successfully!');

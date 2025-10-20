/**
 * Create simple placeholder PNG icons without external dependencies
 * This creates minimal valid PNG files
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// These are minimal valid PNG files (1x1 blue pixel) encoded as base64
// We'll create simple colored squares for each size
const createMinimalPNG = (size, r, g, b) => {
    // PNG file structure for a solid color square
    const width = size;
    const height = size;

    // Create a simple PNG with a solid color
    // This is a minimal PNG with IHDR, IDAT, and IEND chunks
    const png = [];

    // PNG signature
    png.push(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);

    // IHDR chunk
    const ihdr = [
        (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff,
        (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff,
        8, // bit depth
        2, // color type (RGB)
        0, 0, 0 // compression, filter, interlace
    ];

    png.push(...createChunk('IHDR', ihdr));

    // IDAT chunk (compressed pixel data)
    const pixelData = [];
    for (let y = 0; y < height; y++) {
        pixelData.push(0); // filter type
        for (let x = 0; x < width; x++) {
            pixelData.push(r, g, b); // RGB values
        }
    }

    const compressed = require('zlib').deflateSync(Buffer.from(pixelData));
    png.push(...createChunk('IDAT', Array.from(compressed)));

    // IEND chunk
    png.push(...createChunk('IEND', []));

    return Buffer.from(png);
};

function createChunk(type, data) {
    const length = data.length;
    const chunk = [];

    // Length
    chunk.push((length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);

    // Type
    chunk.push(...type.split('').map(c => c.charCodeAt(0)));

    // Data
    chunk.push(...data);

    // CRC
    const crcData = [...type.split('').map(c => c.charCodeAt(0)), ...data];
    const crc = calculateCRC(crcData);
    chunk.push((crc >> 24) & 0xff, (crc >> 16) & 0xff, (crc >> 8) & 0xff, crc & 0xff);

    return chunk;
}

function calculateCRC(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
        }
    }
    return crc ^ 0xFFFFFFFF;
}

// Create icons with a nice blue color (DraftLoom brand color)
const sizes = [16, 48, 128];
const r = 74;  // #4A90E2
const g = 144;
const b = 226;

sizes.forEach(size => {
    try {
        const png = createMinimalPNG(size, r, g, b);
        const filePath = path.join(iconsDir, `icon${size}.png`);
        fs.writeFileSync(filePath, png);
        console.log(`✅ Generated icon${size}.png (${size}x${size} blue square)`);
    } catch (error) {
        console.error(`❌ Failed to generate ${size}px icon:`, error.message);
    }
});

console.log('🎉 All placeholder icons created successfully!');
console.log('💡 Tip: Replace these with custom designed icons later for better branding.');

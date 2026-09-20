const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// 1. Create SVG Icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="120" fill="#f6f5f4"/>
  <rect x="24" y="24" width="464" height="464" rx="100" fill="#ffffff" stroke="rgba(0,0,0,0.08)" stroke-width="6"/>
  <path d="M288 80 L176 280 L256 280 L224 432 L336 232 L256 232 Z" fill="#0075de"/>
</svg>`;
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg, 'utf8');

// 2. Generate clean PNG icons using pure Node.js zlib
function createPng(size, r, g, b) {
  const width = size;
  const height = size;
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const cx = x - width / 2;
      const cy = y - height / 2;
      const radius = width * 0.46;
      const dist = Math.sqrt(cx * cx + cy * cy);
      if (dist <= radius) {
        // Notion blue center with slight soft border
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = 255;
      } else {
        // Warm paper background #f6f5f4
        rawData[pixelOffset] = 246;
        rawData[pixelOffset + 1] = 245;
        rawData[pixelOffset + 2] = 244;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 0, 117, 222));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 0, 117, 222));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(192, 0, 117, 222));

console.log('Successfully generated public/icons/icon-192.png, icon-512.png, and icon.svg');

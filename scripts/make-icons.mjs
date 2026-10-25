// Renders the app icon (same design as public/icon.svg) to PNGs with no dependencies.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [0x0e, 0x0f, 0x11];
const ORANGE = [0xff, 0x5a, 0x1f];
const BONE = [0xf2, 0xf0, 0xea];

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (const b of buf) {
    c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** maskable: full-bleed background and a smaller mark inside the 80% safe zone. */
function render(size, maskable) {
  const s = size / 512;
  const scale = maskable ? 0.72 : 1;
  const c = size / 2;
  const ringR = 150 * s * scale;
  const ringW = 22 * s * scale;
  const barHalfW = 136 * s * scale;
  const barHalfH = 22 * s * scale;
  const corner = maskable ? 0 : 112 * s;
  const SS = 4; // supersampling for smooth edges

  const pixel = (x, y) => {
    // Rounded-square mask for the non-maskable icon.
    const dx = Math.max(corner - x, x - (size - corner), 0);
    const dy = Math.max(corner - y, y - (size - corner), 0);
    if (corner && dx * dx + dy * dy > corner * corner) return null;
    if (Math.abs(x - c) <= barHalfW && Math.abs(y - c) <= barHalfH) return BONE;
    const d = Math.hypot(x - c, y - c);
    if (Math.abs(d - ringR) <= ringW) return ORANGE;
    return BG;
  };

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const p = pixel(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
          if (!p) continue;
          r += p[0];
          g += p[1];
          b += p[2];
          hits++;
        }
      }
      const o = y * (size * 4 + 1) + 1 + x * 4;
      const n = hits || 1;
      raw[o] = Math.round(r / n);
      raw[o + 1] = Math.round(g / n);
      raw[o + 2] = Math.round(b / n);
      raw[o + 3] = Math.round((hits / (SS * SS)) * 255);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync('public/icon-192.png', render(192, false));
writeFileSync('public/icon-512.png', render(512, false));
writeFileSync('public/icon-maskable-512.png', render(512, true));
console.log('icons written');

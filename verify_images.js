import fs from 'fs';

const files = [
  './AdPay_Final/icon-192x192.png',
  './AdPay_Final/icon-512x512.png',
  './AdPay_Final/screenshot1.png',
  './AdPay_Final/screenshot2.png'
];

files.forEach(f => {
  try {
    const buff = fs.readFileSync(f);
    console.log(`${f} - Size: ${buff.length}`);
    const hex = buff.slice(0, 4).toString('hex');
    console.log(`  Header: ${hex} (PNG should be 89504e47)`);
  } catch (e) {
    console.error(`Error reading ${f}:`, e.message);
  }
});

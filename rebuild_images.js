import fs from 'fs';
import { Jimp } from 'jimp';

async function rebuildImages() {
  const icon192 = new Jimp({ width: 192, height: 192, color: 0x09090bff });
  icon192.write('./AdPay_Final/icon-192x192.png');
  
  const icon512 = new Jimp({ width: 512, height: 512, color: 0x09090bff });
  icon512.write('./AdPay_Final/icon-512x512.png');

  const screenshot1 = new Jimp({ width: 1080, height: 1920, color: 0x09090bff });
  screenshot1.write('./AdPay_Final/screenshot1.png');

  const screenshot2 = new Jimp({ width: 1920, height: 1080, color: 0x09090bff });
  screenshot2.write('./AdPay_Final/screenshot2.png');

  console.log('Images rebuilt cleanly with pure Jimp.');
}

rebuildImages().catch(console.error);

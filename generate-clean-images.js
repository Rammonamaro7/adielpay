import Jimp from 'jimp';
import fs from 'fs';

async function main() {
  const fintechColor = '#059669'; // Emerald Green
  
  console.log('Generating 512x512 icon...');
  const icon512 = new Jimp(512, 512, fintechColor);
  const font512 = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  icon512.print(font512, 0, 0, { text: 'AP', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 512, 512);
  await icon512.writeAsync('./public/icon-512x512.png');
  
  console.log('Generating 192x192 icon...');
  const icon192 = new Jimp(192, 192, fintechColor);
  const font192 = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  icon192.print(font192, 0, 0, { text: 'AP', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 192, 192);
  await icon192.writeAsync('./public/icon-192x192.png');
  
  console.log('Generating screenshot 1...');
  const sc1 = new Jimp(1080, 1920, fintechColor);
  sc1.print(font192, 0, 0, { text: 'AdPay', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 1080, 1920);
  await sc1.writeAsync('./public/screenshot1.png');
  
  console.log('Generating screenshot 2...');
  const sc2 = new Jimp(1920, 1080, fintechColor);
  sc2.print(font192, 0, 0, { text: 'AdPay', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 1920, 1080);
  await sc2.writeAsync('./public/screenshot2.png');
  
  console.log('Done generating clean PNGs!');
}

main().catch(console.error);

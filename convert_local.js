import { Jimp } from 'jimp';
import fs from 'fs';

async function convertIcons() {
  try {
    // Baixar o JPG
    const res = await fetch('https://i.postimg.cc/sXZ4dvQt/Whats-App-Image-2026-04-22-at-14-18-59.jpg', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!res.ok) throw new Error('Não baixou original');
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync('./temp.jpg', Buffer.from(arrayBuffer));
    
    // Converter usando Jimp
    const image = await Jimp.read('./temp.jpg');
    
    const img192 = image.clone().resize({ w: 192, h: 192 });
    await img192.write('./public/icon-192x192.png');
    
    const img512 = image.clone().resize({ w: 512, h: 512 });
    await img512.write('./public/icon-512x512.png');
    
    console.log('Conversão concluída perfeitamente!');
    fs.unlinkSync('./temp.jpg');
  } catch (err) {
    console.error('Erro:', err);
  }
}
convertIcons();

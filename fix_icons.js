import fs from 'fs';

async function fix() {
  const url = 'https://i.postimg.cc/sXZ4dvQt/Whats-App-Image-2026-04-22-at-14-18-59.jpg';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://postimg.cc/'
      }
    });
    
    if (!res.ok) throw new Error('HTTP ' + res.status);
    
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync('./public/icon-192x192.jpg', buffer);
    fs.writeFileSync('./public/icon-512x512.jpg', buffer);
    
    console.log('SUCESSO! Tamanho da imagem salva:', buffer.length, 'bytes');
  } catch (err) {
    console.error('Falha:', err);
  }
}

fix();

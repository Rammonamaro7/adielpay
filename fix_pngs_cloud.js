import fs from 'fs';

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha no download: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function fixAsTruePNG() {
  const url192 = 'https://res.cloudinary.com/demo/image/fetch/w_192,h_192,f_png/https://i.postimg.cc/sXZ4dvQt/Whats-App-Image-2026-04-22-at-14-18-59.jpg';
  const url512 = 'https://res.cloudinary.com/demo/image/fetch/w_512,h_512,f_png/https://i.postimg.cc/sXZ4dvQt/Whats-App-Image-2026-04-22-at-14-18-59.jpg';
  
  try {
    await download(url192, './public/icon-192x192.png');
    await download(url512, './public/icon-512x512.png');
    console.log('SUCESSO! PNGs verdadeiros criados com Cloudinary.');
  } catch (err) {
    console.error('Falha:', err);
  }
}

fixAsTruePNG();

import fs from 'fs';

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha no download: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

async function fixAsTruePNG() {
  // Passando por um servidor de processamento de imagens para FORÇAR a conversão da sua foto para PNG real
  const url192 = 'https://wsrv.nl/?url=i.postimg.cc/sXZ4dvQt/Whats-App-Image-2026-04-22-at-14-18-59.jpg&w=192&h=192&output=png';
  const url512 = 'https://wsrv.nl/?url=i.postimg.cc/sXZ4dvQt/Whats-App-Image-2026-04-22-at-14-18-59.jpg&w=512&h=512&output=png';
  
  try {
    await download(url192, './public/icon-192x192.png');
    await download(url512, './public/icon-512x512.png');
    console.log('SUCESSO! PNGs verdadeiros criados com sucesso.');
  } catch (err) {
    console.error('Falha:', err);
  }
}

fixAsTruePNG();

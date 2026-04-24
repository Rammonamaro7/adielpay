import https from 'https';

async function testNetlify() {
  const baseUrl = 'https://stately-madeleine-43b048.netlify.app';
  
  try {
    const mRes = await fetch(`${baseUrl}/manifest.json`);
    console.log('Manifest status:', mRes.status);
    const manifest = await mRes.json();
    
    for (const icon of manifest.icons) {
      console.log(`Buscando icone: ${baseUrl}${icon.src}`);
      const iRes = await fetch(`${baseUrl}${icon.src}`);
      console.log(`Status ${icon.src}:`, iRes.status);
      const buff = await iRes.arrayBuffer();
      console.log(`Tamanho ${icon.src}:`, buff.byteLength);
      const arr = new Uint8Array(buff.slice(0, 4));
      console.log(`Header ${icon.src}:`, arr[0].toString(16), arr[1].toString(16), arr[2].toString(16), arr[3].toString(16));
    }

    if (manifest.screenshots) {
      for (const sc of manifest.screenshots) {
        console.log(`Buscando screenshot: ${baseUrl}${sc.src}`);
        const sRes = await fetch(`${baseUrl}${sc.src}`);
        console.log(`Status ${sc.src}:`, sRes.status);
        const buff = await sRes.arrayBuffer();
        console.log(`Tamanho ${sc.src}:`, buff.byteLength);
      }
    }
    
  } catch(e) {
    console.error(e);
  }
}
testNetlify();

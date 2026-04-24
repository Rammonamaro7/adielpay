import https from 'https';

async function testNetlifyReal() {
  const baseUrl = 'https://dashing-bienenstitch-363f46.netlify.app';
  
  try {
    const urls = [
      '/manifest.json',
      '/icon-192x192.png',
      '/icon-512x512.png',
      '/screenshot1.png',
      '/screenshot2.png'
    ];
    
    for (const url of urls) {
      console.log(`Buscando: ${baseUrl}${url}`);
      const res = await fetch(`${baseUrl}${url}`);
      console.log(`Status ${url}:`, res.status, 'Content-Type:', res.headers.get('content-type'));
      const buff = await res.arrayBuffer();
      console.log(`Tamanho ${url}:`, buff.byteLength);
      const arr = new Uint8Array(buff.slice(0, 4));
      console.log(`Header ${url}:`, arr[0]?.toString(16), arr[1]?.toString(16), arr[2]?.toString(16), arr[3]?.toString(16));
    }
  } catch(e) {
    console.error(e);
  }
}
testNetlifyReal();

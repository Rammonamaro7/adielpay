import fs from 'fs';
import https from 'https';

const url = 'https://i.postimg.cc/sXZ4dvQt/Whats-App-Image-2026-04-22-at-14-18-59.jpg';

https.get(url, (res) => {
  const file1 = fs.createWriteStream('./public/icon-192x192.png');
  const file2 = fs.createWriteStream('./public/icon-512x512.png');
  
  res.on('data', (chunk) => {
    file1.write(chunk);
    file2.write(chunk);
  });
  
  res.on('end', () => {
    file1.end();
    file2.end();
    console.log('Images downloaded');
  });
});

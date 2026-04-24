import https from 'https';
import fs from 'fs';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  const fintechColor = '059669'; // Emerald Green
  
  console.log('Downloading 512x512 icon...');
  await download(`https://ui-avatars.com/api/?name=Ad+Pay&background=${fintechColor}&color=fff&size=512&font-size=0.45&bold=true&format=png`, './public/icon-512x512.png');
  
  console.log('Downloading 192x192 icon...');
  await download(`https://ui-avatars.com/api/?name=Ad+Pay&background=${fintechColor}&color=fff&size=192&font-size=0.45&bold=true&format=png`, './public/icon-192x192.png');
  
  console.log('Downloading screenshots...');
  await download(`https://dummyimage.com/1080x1920/${fintechColor}/ffffff.png?text=AdPay`, './public/screenshot1.png');
  await download(`https://dummyimage.com/1920x1080/${fintechColor}/ffffff.png?text=AdPay`, './public/screenshot2.png');
  
  console.log('Done!');
}

main().catch(console.error);

import fs from 'fs';

function checkFile(path) {
  try {
    const buff = fs.readFileSync(path);
    const arr = new Uint8Array(buff.slice(0, 4));
    console.log(`Header ${path}:`, arr[0].toString(16), arr[1].toString(16), arr[2].toString(16), arr[3].toString(16));
  } catch(e) {
    console.log(`${path} not found`);
  }
}

checkFile('./public/icon-192x192.png');
checkFile('./AdPay_Final/icon-192x192.png');
checkFile('./public/screenshot1.png');

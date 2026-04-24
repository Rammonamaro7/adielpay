import fs from 'fs';
console.log('192', fs.statSync('./public/icon-192x192.png').size);
console.log('512', fs.statSync('./public/icon-512x512.png').size);

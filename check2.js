import fs from 'fs';
console.log('sc1', fs.statSync('./public/screenshot1.png').size);
console.log('sc2', fs.statSync('./public/screenshot2.png').size);

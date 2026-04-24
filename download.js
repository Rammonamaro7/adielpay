import fs from 'fs';
import https from 'https';

https.get('https://postimg.cc/7Gw2SPNV', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/https:\/\/i\.postimg\.cc\/[^"]+/);
    if (match) {
      console.log(match[0]);
    }
  });
});

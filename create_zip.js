import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const zip = new AdmZip();
zip.addLocalFolder('./dist', '');
// To make sure routing works on Netlify
if (!fs.existsSync('./dist/_redirects')) {
    zip.addFile('_redirects', Buffer.from('/*    /index.html   200\n', 'utf8'));
}
zip.writeZip('./PUBLIC_NETLIFY_ZIP.zip');
fs.copyFileSync('./PUBLIC_NETLIFY_ZIP.zip', './public/APP_ATUALIZADO.zip');
console.log('Zip completed! Available at /APP_ATUALIZADO.zip');

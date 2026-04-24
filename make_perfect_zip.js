import AdmZip from 'adm-zip';
import fs from 'fs';

const zip = new AdmZip();
zip.addLocalFolder('./AdPay_Final', '');
zip.writeZip('./NETLIFY_USAR_ESSE.zip');
fs.copyFileSync('./NETLIFY_USAR_ESSE.zip', './public/NETLIFY_USAR_ESSE.zip');

const checkZip = new AdmZip('./NETLIFY_USAR_ESSE.zip');
console.log("Arquivos na raiz do ZIP:", checkZip.getEntries().map(e => e.entryName));

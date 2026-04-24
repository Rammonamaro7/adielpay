import AdmZip from 'adm-zip';

const zip = new AdmZip();
// addLocalFolder(localPath, zipPath)
// zipPath = '' means root of the zip
zip.addLocalFolder('./AdPay_Final', '');
zip.writeZip('./public/AdPay_Final_Deploy_Fixed.zip');

console.log('Zip gerado com sucesso no padrão do Netlify!');

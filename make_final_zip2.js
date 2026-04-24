import AdmZip from 'adm-zip';
import fs from 'fs';

const zipName = 'AdPay_Netlify_Oficial.zip';
try {
  const zip = new AdmZip();
  zip.addLocalFolder('./AdPay_Final'); // Adiciona a pasta compilada pura
  zip.writeZip(`./${zipName}`);
  console.log('Zip file criado: ' + zipName);
} catch (err) {
  console.error("Error creating zip:", err);
}

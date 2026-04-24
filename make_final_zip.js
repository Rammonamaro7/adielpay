import AdmZip from 'adm-zip';
import fs from 'fs';

const zipName = 'AdPay_Pronto_Para_Netlify.zip';
try {
  const zip = new AdmZip();
  // Adds all files and subdirectories from AdPay_Final into the root of the zip
  zip.addLocalFolder('./AdPay_Final');
  zip.writeZip(`./${zipName}`);
  console.log('Zip file created successfully!');
  
  // Verify what's inside
  const verifyZip = new AdmZip(`./${zipName}`);
  verifyZip.getEntries().forEach(entry => {
    if (entry.name.endsWith('.png')) {
      const data = entry.getData();
      const hex = data.slice(0, 4).toString('hex');
      console.log(`Verify ${entry.entryName} -> Header: ${hex} (Length: ${data.length})`);
    } else {
      console.log(`Included: ${entry.entryName}`);
    }
  });

} catch (err) {
  console.error("Error creating zip:", err);
}

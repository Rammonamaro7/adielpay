import AdmZip from 'adm-zip';

['APP2.zip', 'AdPay_Final_Deploy_Fixed.zip', 'AdPay_Final_Deploy.zip'].forEach(fileName => {
  try {
    const zip = new AdmZip(fileName);
    const entries = zip.getEntries();
    console.log(`\nVerifying ${fileName}:`);
    for(let entry of entries) {
      if (entry.name.endsWith('.png')) {
        const data = entry.getData();
        console.log(`${entry.entryName}: ${data[0].toString(16)} ${data[1].toString(16)} ${data[2].toString(16)} ${data[3].toString(16)}`);
      }
    }
  } catch(e) {}
});

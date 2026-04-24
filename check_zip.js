import AdmZip from 'adm-zip';

const zip = new AdmZip('AdPay_Final_Deploy.zip');
const entries = zip.getEntries();
for(let entry of entries) {
  if (entry.name.endsWith('.png')) {
    const data = entry.getData();
    if (data[0] !== 0x89 || data[1] !== 0x50) {
      console.log('CORRUPT IN ZIP:', entry.name);
    } else {
      console.log('VALID IN ZIP:', entry.name);
    }
  }
}

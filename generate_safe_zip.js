import fs from 'fs';
import archiver from 'archiver';

const output = fs.createWriteStream('./ARRASTE_ISSO_PRO_NETLIFY.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Nível máximo de compressão (padrão super seguro)
});

output.on('close', function() {
  console.log('Zip criado perfeitamente com ' + archive.pointer() + ' bytes');
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// O false ali no final é a MÁGICA: Ele pega o CONTEÚDO da pasta e joga na RAIZ do zip, 
// sem criar a sub-pasta "AdPay_Final"
archive.directory('AdPay_Final/', false);

archive.finalize();

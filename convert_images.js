import Jimp from 'jimp';

async function convert() {
  try {
    const img1 = await Jimp.read('./public/icon-192x192.png');
    await img1.resize(192, 192).writeAsync('./public/icon-192x192.png');
    
    const img2 = await Jimp.read('./public/icon-512x512.png');
    await img2.resize(512, 512).writeAsync('./public/icon-512x512.png');
    
    console.log('Images converted to true PNG and resized');
  } catch (err) {
    console.error(err);
  }
}

convert();

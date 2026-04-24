import https from 'https';

async function testProxy() {
  const url = 'https://cdn.statically.io/img/i.postimg.cc/sXZ4dvQt/Whats-App-Image-2026-04-22-at-14-18-59.jpg';
  try {
    const res = await fetch(url);
    console.log(res.status, res.headers.get('content-type'));
  } catch(e) {
    console.log(e.message);
  }
}
testProxy();

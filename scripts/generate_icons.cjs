const fs = require('fs');
const https = require('https');
const path = require('path');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const request = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        request.on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function main() {
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    const files = [
        { url: 'https://placehold.co/192x192/0284c7/ffffff/png?text=AP', dest: 'icon-192x192.png' },
        { url: 'https://placehold.co/512x512/0284c7/ffffff/png?text=AP', dest: 'icon-512x512.png' },
        { url: 'https://placehold.co/1080x1920/0284c7/ffffff/png?text=Adielpay', dest: 'screenshot1.png' },
        { url: 'https://placehold.co/1920x1080/0284c7/ffffff/png?text=Adielpay', dest: 'screenshot2.png' }
    ];

    for (const f of files) {
        console.log(`Getting ${f.dest}...`);
        await downloadFile(f.url, path.join(publicDir, f.dest));
        console.log(`Saved ${f.dest}`);
    }
}

main();

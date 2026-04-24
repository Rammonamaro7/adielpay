import fs from 'fs';

fs.writeFileSync('./serve_github.js', `
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.use(express.static('./AdPay_Final'));

app.listen(3000, () => {
    console.log('App is fully live on port 3000');
});
`);

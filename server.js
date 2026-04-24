import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());

// Se o usuário acessar /, enviar o index.html da pasta final
app.use(express.static('./AdPay_Final'));

app.listen(3000, '0.0.0.0', () => {
    console.log('App is fully live on 0.0.0.0:3000!');
});

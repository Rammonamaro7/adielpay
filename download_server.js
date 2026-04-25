import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve public directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve root directory (just in case)
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial, sans-serif; padding: 2rem; text-align: center;">
        <h1>Arquivos para Download</h1>
        <p>Clique no botão abaixo para baixar o seu projeto com as correções do extrato:</p>
        <a href="/AdPay_Netlify_Deploy.zip" download style="display: inline-block; padding: 15px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 20px; margin-top: 20px;">
          ⬇️ Baixar Projeto AdPay (ZIP)
        </a>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

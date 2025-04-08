const express = require('express');
const fileUpload = require('express-fileupload');
const { createWorker } = require('tesseract.js');
const cors = require('cors');
const fs = require('fs');
const serverless = require('serverless-http');

const app = express();

// Configuração do fileUpload
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}));

// Outros middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rotas dinâmicas para arquivos HTML na pasta public
const htmlFiles = fs.readdirSync(__dirname + '/public')
  .filter(file => file.endsWith('.html'))
  .map(file => file.replace('.html', ''));

htmlFiles.forEach(route => {
  app.get(`/${route}`, (req, res) => {
    res.sendFile(__dirname + `/public/${route}.html`);
  });
});

// Rota OCR com tratamento de erro aprimorado
app.post('/api/ocr', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const worker = await createWorker({
      logger: m => console.log(m),
    });

    // Carregar o worker e as linguagens antes de reconhecer a imagem
    await worker.load();
    await worker.loadLanguage('por');
    await worker.initialize('por');
    
    const { data: { text } } = await worker.recognize(req.files.file.tempFilePath);
    
    await worker.terminate();
    
    res.json({ text });
  } catch (error) {
    console.error('Erro no OCR:', error);
    res.status(500).json({ 
      error: 'Erro ao processar a imagem',
      details: error.message
    });
  }
});

// Rota de validação com melhor tratamento de data
app.post('/api/validate', (req, res) => {
  try {
    const { text } = req.body;
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${
      String(today.getMonth() + 1).padStart(2, '0')}/${
      today.getFullYear()}`;
      
    const isValid = text.includes('REGISTADO') && text.includes(formattedDate);

    res.json({
      approved: isValid,
      ...(isValid 
          ? { guideLink: 'https://www.mediafire.com/file/uuzkvycvmrmo0ac/GuiaDeApostas.pdf/file' }
          : { message: 'Erro na validação. Verifique:\n1. Se criou a conta pelo link fornecido\n2. Tente criar de novo\n3. Crie nova conta' }
      )
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro na validação',
      details: error.message
    });
  }
});

// Não precisa do app.listen() no Vercel – a função exportada cuidará disso
module.exports = serverless(app);

const express = require('express');
const fileUpload = require('express-fileupload');
const { createWorker } = require('tesseract.js');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();

// Middlewares de upload e JSON
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 5 * 1024 * 1024 } // Limite 5MB
}));
app.use(cors());
app.use(express.json());

// Rota padrão para teste da API
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando corretamente!' });
});

// Rota OCR: recebe upload de imagem e faz o reconhecimento
app.post('/ocr', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const worker = await createWorker({
      logger: m => console.log(m)
    });
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

// Rota de validação: verifica se o texto contém certas informações
app.post('/validate', (req, res) => {
  try {
    const { text } = req.body;
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
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

// Exporta a aplicação Express encapsulada em serverless-http
module.exports = serverless(app);

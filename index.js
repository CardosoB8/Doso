const express = require('express');
const fileUpload = require('express-fileupload');
const Tesseract = require('tesseract.js');
const cors = require('cors');
const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static('public'));

// Rotas amigáveis
app.get(['/', '/free'], (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Rota para processamento OCR
app.post('/api/ocr', async (req, res) => {
  try {
    if (!req.files?.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const { data: { text } } = await Tesseract.recognize(
      req.files.file.data,
      'por',
      {
        tessedit_char_whitelist: '0123456789/ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
      }
    );

    res.json({ text });
  } catch (error) {
    console.error('Erro no OCR:', error);
    res.status(500).json({ error: 'Erro ao processar a imagem' });
  }
});

// Rota para validação final
app.post('/api/validate', (req, res) => {
  const { text } = req.body;
  const today = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  const isValid = text.includes('REGISTADO') && text.includes(today);

  if(isValid) {
    res.json({ 
      approved: true,
      guideLink: 'https://www.mediafire.com/file/uuzkvycvmrmo0ac/GuiaDeApostas.pdf/file' 
    });
  } else {
    res.json({ 
      approved: false,
      message: 'Erro ao aprovar o comprovante. Verifique se criou a conta através do link fornecido.'
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}/home`);
});
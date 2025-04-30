// server.js
const express       = require('express');
const fileUpload    = require('express-fileupload');
const { createWorker } = require('tesseract.js');
const cors          = require('cors');
const fs            = require('fs');
const path          = require('path');

const app  = express();
const port = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
  useTempFiles:   true,
  tempFileDir:    '/tmp/',
  limits:         { fileSize: 5 * 1024 * 1024 },  // 5MB
}));

// --- Rotas para .html estáticos ---
fs.readdirSync(path.join(__dirname, 'public'))
  .filter(f => f.endsWith('.html'))
  .forEach(f => {
    const route = f.replace('.html','');
    app.get(`/${route}`, (req, res) => {
      res.sendFile(path.join(__dirname, 'public', f));
    });
  });

// --- Rota OCR no servidor ---
app.post('/api/ocr', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const worker = await createWorker({ logger: m => console.log(m) });
    await worker.load();
    await worker.loadLanguage('por');
    await worker.initialize('por');

    const { data: { text } } = await worker.recognize(req.files.file.tempFilePath);
    await worker.terminate();

    // opcional: remover o arquivo temporário
    fs.unlink(req.files.file.tempFilePath, () => {});

    res.json({ text });
  } catch (err) {
    console.error('Erro no OCR:', err);
    res.status(500).json({ error: 'Erro ao processar OCR', details: err.message });
  }
});

// --- Rota de validação com normalização, fallback e debug ---
app.post('/api/validate', (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto inválido para validação' });
    }

    // 1) Normalize/acento, unifica espaços e lowercase
    const original = text;
    const cleaned = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // 2) Data de hoje
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2,'0')}/${
      String(today.getMonth()+1).padStart(2,'0')
    }/${today.getFullYear()}`.toLowerCase();

    // 3) Checagem das palavras
    const required = ['registado', formattedDate];
    const hasAllRequired = required.every(w => cleaned.includes(w));
    const hasObrigado     = /\bobrigado\b/.test(cleaned);

    const approved = hasAllRequired || hasObrigado;

    // 4) Resposta
    if (approved) {
      return res.json({
        approved:  true,
        guideLink: 'https://www.mediafire.com/file/zvy5z1jdow995aj/10_Ferramentas_de_Apostas_online_para_iniciantes.pdf/file'
      });
    } else {
      return res.json({
        approved: false,
        message:  'Erro na validação. Verifique:\n'
               + '1. Se criou a conta pelo link fornecido\n'
               + '2. Tente criar de novo\n'
               + '3. Crie nova conta',
        debug: {
          original,
          cleaned
        }
      });
    }
  } catch (err) {
    console.error('Erro na validação:', err);
    res.status(500).json({ error: 'Erro interno na validação', details: err.message });
  }
});

// --- Start server ---
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}/index.html`);
});

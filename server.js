const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

// Configurar upload
const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        const data = new Date().toISOString().slice(0,10);
        const nome = req.body.nomeLoja || 'cliente';
        cb(null, `${data}_${nome}.zip`);
    }
});

const upload = multer({ storage });

// 1️⃣ ROTA PRINCIPAL: Receber o ZIP
app.post('/upload-site', upload.single('site'), (req, res) => {
    console.log('✅ Site recebido:', req.file.filename);
    res.json({ success: true, arquivo: req.file.filename });
});

// 2️⃣ ROTA PARA VER ARQUIVOS
app.get('/admin/arquivos', (req, res) => {
    // Verificar se pasta existe
    if (!fs.existsSync('./uploads')) {
        return res.json([]);
    }
    
    const arquivos = fs.readdirSync('./uploads').map(f => {
        const stats = fs.statSync(`./uploads/${f}`);
        return {
            nome: f,
            data: stats.birthtime,
            tamanho: (stats.size / 1024).toFixed(2) + ' KB'
        };
    });
    res.json(arquivos);
});

// 3️⃣ ROTA PARA BAIXAR
app.get('/download/:arquivo', (req, res) => {
    const arquivo = req.params.arquivo;
    const caminho = `./uploads/${arquivo}`;
    
    if (fs.existsSync(caminho)) {
        res.download(caminho);
    } else {
        res.status(404).json({ erro: 'Arquivo não encontrado' });
    }
});

// 4️⃣ ROTA INICIAL (só para testar)
app.get('/', (req, res) => {
    res.send('🚀 PayPro Backend rodando no Render!');
});

// Criar pasta uploads se não existir
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
    console.log('📁 Pasta uploads criada');
}

// ✅ USAR A PORTA DO RENDER (process.env.PORT) com fallback para 3000
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(40));
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Uploads salvos em: ./uploads`);
    console.log('='.repeat(40));
});
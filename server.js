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

// =============================================
// ROTA 1: Receber o ZIP (já existente)
// =============================================
app.post('/upload-site', upload.single('site'), (req, res) => {
    console.log('✅ Site recebido:', req.file.filename);
    res.json({ success: true, arquivo: req.file.filename });
});

// =============================================
// ROTA 2: Lista de arquivos em JSON (para API)
// =============================================
app.get('/admin/arquivos', (req, res) => {
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

// =============================================
// ROTA 3: Download de arquivo
// =============================================
app.get('/download/:arquivo', (req, res) => {
    const arquivo = req.params.arquivo;
    const caminho = `./uploads/${arquivo}`;
    
    if (fs.existsSync(caminho)) {
        res.download(caminho);
    } else {
        res.status(404).json({ erro: 'Arquivo não encontrado' });
    }
});

// =============================================
// ROTA 4: PÁGINA ADMIN (NOVA! - Interface bonita)
// =============================================
app.get('/admin', (req, res) => {
    // Verificar se pasta uploads existe
    if (!fs.existsSync('./uploads')) {
        return res.send(`
            <html>
            <head>
                <title>PayPro Admin</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body{font-family:Arial;padding:20px;background:#f5f5f5;}
                    .container{max-width:800px;margin:0 auto;background:white;border-radius:10px;padding:20px;text-align:center;}
                    h1{color:#6366f1;}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📁 PayPro - Administração</h1>
                    <p>Nenhum arquivo enviado ainda.</p>
                    <p><small>Os uploads aparecerão aqui quando chegarem.</small></p>
                </div>
            </body>
            </html>
        `);
    }
    
    // Ler arquivos da pasta uploads
    const arquivos = fs.readdirSync('./uploads');
    
    // Gerar HTML bonito
    let html = `
        <html>
        <head>
            <title>PayPro Admin</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body{font-family:Arial;padding:20px;background:#f5f5f5;}
                .container{max-width:800px;margin:0 auto;background:white;border-radius:10px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
                h1{color:#6366f1; border-bottom:2px solid #6366f1; padding-bottom:10px;}
                ul{list-style:none;padding:0;}
                li{
                    background:#f8fafc;
                    margin:10px 0;
                    padding:15px;
                    border-radius:8px;
                    border:1px solid #e2e8f0;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                }
                .info{flex-grow:1;}
                .nome{font-weight:bold; font-size:16px;}
                .detalhes{color:#64748b; font-size:13px; margin-top:5px;}
                a{
                    background:#10b981;
                    color:white;
                    text-decoration:none;
                    padding:8px 16px;
                    border-radius:6px;
                    font-size:14px;
                }
                a:hover{background:#059669;}
                .vazio{text-align:center; color:#64748b; padding:40px;}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📦 Arquivos Recebidos</h1>
                <p>Total: ${arquivos.length} arquivo(s)</p>
    `;
    
    if (arquivos.length === 0) {
        html += `<div class="vazio">Nenhum arquivo encontrado na pasta uploads.</div>`;
    } else {
        html += `<ul>`;
        arquivos.forEach(arquivo => {
            const stats = fs.statSync(`./uploads/${arquivo}`);
            const data = stats.birthtime.toLocaleString('pt-BR');
            const tamanho = (stats.size / 1024).toFixed(2) + ' KB';
            html += `
                <li>
                    <div class="info">
                        <div class="nome">📄 ${arquivo}</div>
                        <div class="detalhes">${tamanho} • Enviado em ${data}</div>
                    </div>
                    <div>
                        <a href="/download/${arquivo}" target="_blank">⬇️ Baixar</a>
                    </div>
                </li>
            `;
        });
        html += `</ul>`;
    }
    
    html += `
                <p style="margin-top:20px; color:#64748b; font-size:12px;">
                    Os arquivos são armazenados temporariamente. Faça backup regularmente.
                </p>
            </div>
        </body>
        </html>
    `;
    res.send(html);
});

// =============================================
// ROTA 5: Página inicial
// =============================================
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>PayPro Backend</title>
            <style>
                body{font-family:Arial;padding:40px;text-align:center;background:#f5f5f5;}
                .card{background:white;padding:30px;border-radius:20px;max-width:500px;margin:0 auto;}
                h1{color:#6366f1;}
                .links{margin-top:20px;}
                a{display:inline-block;margin:10px;color:#10b981;text-decoration:none;}
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🚀 PayPro Backend</h1>
                <p>Servidor rodando com sucesso!</p>
                <div class="links">
                    <a href="/admin">📋 Admin (ver arquivos)</a>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Criar pasta uploads se não existir
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
    console.log('📁 Pasta uploads criada');
}

// Usar porta do Render ou 3000 como fallback
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(40));
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Uploads salvos em: ./uploads`);
    console.log('='.repeat(40));
});

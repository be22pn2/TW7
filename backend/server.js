require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const MASKS = {
    jogador: 'Quero jogar no time',
    coach: 'Treinador / Análise',
    parceria: 'Patrocínio / Parceria',
    contato: 'Só um contato'
};

function buildEmail(data) {
    const interesse = MASKS[data.interesse] || data.interesse || 'Não informado';
    return {
        subject: `[TW7] Nova solicitação - ${interesse}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                <div style="background: #e10600; color: #fff; padding: 16px 24px; font-size: 20px; font-weight: bold;">TW7 - Nova solicitação pelo site</div>
                <div style="padding: 24px;">
                    <p><strong>Nome:</strong> ${escapeHtml(data.nome)}</p>
                    <p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p>
                    <p><strong>Tag / Nickname:</strong> ${escapeHtml(data.tag || 'Não informado')}</p>
                    <p><strong>Interesse:</strong> ${escapeHtml(interesse)}</p>
                    <p><strong>Mensagem:</strong></p>
                    <blockquote style="background: #f7f7f7; padding: 12px 16px; border-radius: 6px; color: #333;">${escapeHtml(data.mensagem || '—')}</blockquote>
                    <p style="color: #888; font-size: 13px; margin-top: 24px;">Você pode responder direto para <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>.</p>
                </div>
            </div>
        `
    };
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

app.post('/api/contact', async function (req, res) {
    try {
        const { nome, email, tag, interesse, mensagem } = req.body;

        if (!nome || !String(nome).trim()) {
            return res.status(400).json({ ok: false, error: 'Informe seu nome.' });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
            return res.status(400).json({ ok: false, error: 'Informe um e-mail válido.' });
        }

        const mail = buildEmail({ nome, email, tag, interesse, mensagem });

        await transporter.sendMail({
            from: `"Site TW7" <${process.env.SMTP_USER}>`,
            to: process.env.RECIPIENT_EMAIL,
            replyTo: email,
            subject: mail.subject,
            html: mail.html
        });

        res.json({ ok: true });
    } catch (err) {
        console.error('Erro ao enviar e-mail:', err);
        res.status(500).json({ ok: false, error: 'Erro ao enviar o e-mail. Tente novamente.' });
    }
});

app.get('/api/health', function (_req, res) {
    res.json({ ok: true, service: 'tw7-backend' });
});

app.listen(PORT, function () {
    console.log('Servidor TW7 rodando em http://localhost:' + PORT);
});
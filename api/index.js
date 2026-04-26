const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(session({
    secret: 'ropasso-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Kırmızı-Beyaz Modern Arayüz Şablonu
const ui = (body) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Bilet Sistemi</title>
    <style>
        body { background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma; margin: 0; display: flex; flex-direction: column; align-items: center; }
        .nav { background-color: #e30613; width: 100%; padding: 20px; text-align: center; color: white; font-weight: bold; font-size: 24px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .container { background: white; margin-top: 50px; padding: 30px; border-radius: 15px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); text-align: center; width: 90%; max-width: 400px; border-top: 6px solid #e30613; }
        .btn { background-color: #e30613; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin-top: 20px; transition: 0.3s; }
        .btn:hover { background-color: #222; transform: translateY(-2px); }
        .footer { margin-top: 30px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="nav">ROPASSO</div>
    <div class="container">${body}</div>
    <div class="footer">© 2026 RoPasso - Tüm Hakları Saklıdır.</div>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(ui(`
        <h2 style="color:#333">Hoş Geldiniz</h2>
        <p>Roblox sunucularına giriş için biletinizi hemen tanımlayın.</p>
        <a href="/login" class="btn">Discord ile Giriş Yap</a>
    `));
});

app.get('/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const user = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        req.session.user = user.data;
        res.redirect('/dashboard');
    } catch (err) { res.send("Giriş sırasında bir hata oluştu."); }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <h2 style="color:#e30613">Hesabım</h2>
        <p>Giriş Yapan: <b>${req.session.user.username}</b></p>
        <hr style="border:0; border-top:1px solid #eee;">
        <p>Bilet Almak İstediğiniz Sunucuyu Seçin</p>
        <select style="width:100%; padding:10px; border-radius:5px; border:1px solid #ddd; margin-bottom:10px;">
            <option>Sunucu Seçiniz...</option>
        </select>
        <a href="#" class="btn" style="width:85%">Etkinlikleri Listele</a>
    `));
});

module.exports = app;

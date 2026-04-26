const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || 'ropasso-gizli-key',
    resave: false,
    saveUninitialized: false
}));

// GÖRSEL LİNKLERİ
const LOGO_URL = "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png?ex=69ef49ba&is=69edf83a&hm=907abaa3475f136cc06c14450bf639e3c3d355b398a8e30e7736e06ab4453ba3&";
const DISCORD_WHITE_ICON = "https://cdn.discordapp.com/attachments/1497741754777079829/1497743438798389268/39-393163_company-discord-logo-png-white-Photoroom.png?ex=69ef4a86&is=69edf906&hm=598c2232e1889a0024cd3a1c63f772b7cce2082d82773b2da9bd8140cecb0305&";
const SITE_FAVICON = "https://cdn.discordapp.com/attachments/1495543284423065662/1497925916968620063/indir_1.png?ex=69ef4bb8&is=69edfa38&hm=ad460d965721a334d39ec82186fc986fbd90e38da1577826d2beb3a91116762c&";

// PASSOLIG TARZI MODERN ARAYÜZ
const ui = (body) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="${SITE_FAVICON}">
    <title>RoPasso | Dijital Taraftar Kartı</title>
    <style>
        body { background-color: #f8f9fa; font-family: 'Segoe UI', Arial, sans-serif; margin: 0; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .header { background-color: #e30613; width: 100%; padding: 15px 0; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
        .header img { height: 50px; }
        .container { background: white; margin-top: 40px; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); text-align: center; width: 90%; max-width: 450px; border-top: 8px solid #e30613; }
        h2 { color: #333; margin-bottom: 10px; font-weight: 800; }
        p { color: #666; line-height: 1.6; }
        .btn-discord { background-color: #5865F2; color: white; padding: 15px 25px; text-decoration: none; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-top: 25px; transition: all 0.3s ease; border: none; font-size: 16px; cursor: pointer; }
        .btn-discord img { height: 20px; margin-right: 12px; }
        .btn-discord:hover { background-color: #4752c4; transform: translateY(-3px); box-shadow: 0 5px 15px rgba(88,101,242,0.4); }
        .footer { margin-top: auto; padding: 20px; color: #aaa; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .server-select { width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #eee; margin: 20px 0; font-size: 16px; outline: none; transition: border-color 0.3s; }
        .server-select:focus { border-color: #e30613; }
        .user-info { display: flex; align-items: center; justify-content: center; background: #fdf2f2; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #f9dcdc; }
        .user-info img { width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; border: 2px solid #e30613; }
    </style>
</head>
<body>
    <div class="header">
        <img src="${LOGO_URL}" alt="RoPasso Logo">
    </div>
    <div class="container">${body}</div>
    <div class="footer">RoPasso Entegre Biletleme Sistemi © 2026</div>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(ui(`
        <h2>Hoş Geldiniz</h2>
        <p>Roblox sunucularında futbol, basketbol ve tüm etkinliklere giriş için biletinizi tanımlayın.</p>
        <a href="/login" class="btn-discord">
            <img src="${DISCORD_WHITE_ICON}"> Discord ile Giriş Yap
        </a>
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
            client_secret: process.env.DISCORD_TOKEN, // SENİN DEĞİŞKEN İSMİN
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const user = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        req.session.user = user.data;
        res.redirect('/dashboard');
    } catch (err) { 
        res.send("Giriş Hatası! Lütfen ayarlarını kontrol et."); 
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const avatarURL = `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png`;
    
    res.send(ui(`
        <div class="user-info">
            <img src="${avatarURL}" alt="Avatar">
            <div style="text-align: left;">
                <span style="display:block; font-size: 12px; color: #888;">Taraftar</span>
                <strong style="color: #333;">${req.session.user.username}</strong>
            </div>
        </div>
        <p>Bilet almak istediğiniz sunucuyu seçerek etkinlikleri listeleyin.</p>
        <select class="server-select">
            <option>Sunucu Seçiniz...</option>
        </select>
        <button style="background:#e30613; color:white; width:100%; padding:15px; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">Etkinlikleri Göster</button>
    `));
});

module.exports = app;

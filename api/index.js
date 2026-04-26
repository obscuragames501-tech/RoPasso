const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(session({
    secret: 'ropasso-gizli-key-2026',
    resave: false,
    saveUninitialized: false
}));

const LOGO_URL = "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png?ex=69ef49ba&is=69edf83a&hm=907abaa3475f136cc06c14450bf639e3c3d355b398a8e30e7736e06ab4453ba3&";
const DISCORD_ICON = "https://cdn.discordapp.com/attachments/1497741754777079829/1497743438798389268/39-393163_company-discord-logo-png-white-Photoroom.png?ex=69ef4a86&is=69edf906&hm=598c2232e1889a0024cd3a1c63f772b7cce2082d82773b2da9bd8140cecb0305&";
const SITE_ICON = "https://cdn.discordapp.com/attachments/1495543284423065662/1497925916968620063/indir_1.png?ex=69ef4bb8&is=69edfa38&hm=ad460d965721a334d39ec82186fc986fbd90e38da1577826d2beb3a91116762c&";

const ui = (body) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="${SITE_ICON}">
    <title>RoPasso | Dijital Bilet</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            background-color: #f8f9fa; 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            margin: 0; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
        }
        .main-card { 
            background: white; 
            border-radius: 30px; 
            box-shadow: 0 25px 80px rgba(0,0,0,0.12); 
            width: 100%; 
            max-width: 440px; 
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(0,0,0,0.05);
        }
        .accent-bar {
            height: 12px;
            background: #e30613;
            width: 100%;
        }
        .card-content { padding: 40px 30px; text-align: center; }
        .logo-container {
            width: 120px;
            height: 120px;
            background: white;
            border-radius: 50%;
            margin: -60px auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 5px solid white;
        }
        .logo-container img { width: 100px; height: auto; }
        h2 { color: #1a1a1a; margin-top: 10px; font-size: 32px; font-weight: 800; letter-spacing: -1px; }
        p { color: #6c757d; line-height: 1.6; font-size: 16px; margin: 15px 0 35px; }
        .btn-action { 
            background-color: #5865F2; 
            color: white; 
            padding: 18px; 
            text-decoration: none; 
            border-radius: 16px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: 700; 
            font-size: 18px;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
            border: none; 
            cursor: pointer;
            width: 100%;
            box-shadow: 0 8px 25px rgba(88,101,242,0.3);
        }
        .btn-action:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(88,101,242,0.4); }
        .btn-action img { height: 26px; margin-right: 14px; }
        .user-pill {
            display: flex;
            align-items: center;
            background: #fef2f2;
            padding: 18px;
            border-radius: 20px;
            margin-bottom: 30px;
            border: 1px solid #fee2e2;
            text-align: left;
        }
        .user-pill img { width: 55px; height: 55px; border-radius: 50%; border: 3px solid #e30613; margin-right: 18px; }
        .footer-note { margin-top: 35px; color: #adb5bd; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
        select {
            width: 100%;
            padding: 16px;
            border-radius: 14px;
            border: 2px solid #edeff2;
            margin-bottom: 25px;
            font-size: 16px;
            background: #fbfbfb;
            color: #495057;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="main-card">
        <div class="accent-bar"></div>
        <div class="card-content">
            <div class="logo-container">
                <img src="${LOGO_URL}" alt="RoPasso Logo">
            </div>
            ${body}
            <div class="footer-note">ROPASSO DIGITAL TICKETING 2026</div>
        </div>
    </div>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(ui(`
        <h2>Hoş Geldiniz</h2>
        <p>Tribünlerde yerini almak için dijital bilet profilini bağla ve maçlara katıl.</p>
        <a href="/login" class="btn-action">
            <img src="${DISCORD_ICON}"> Discord ile Bağlan
        </a>
    `));
});

app.get('/login', (req, res) => {
    // SENİN ATTIĞIN URL'DEKİ SCOPE VE YETKİLERİ BURAYA GÖMDÜM
    const clientID = process.env.DISCORD_CLIENT_ID;
    const redirectURI = process.env.DISCORD_REDIRECT_URI;
    
    if(!clientID || !redirectURI) return res.send("Hata: Vercel Environment Variables eksik!");

    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientID}&permissions=8&response_type=code&redirect_uri=${encodeURIComponent(redirectURI)}&integration_type=0&scope=identify+guilds.members.read+guilds+bot+applications.commands`;
    res.redirect(url);
});

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_TOKEN,
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
        res.send("Hata: " + (err.response ? JSON.stringify(err.response.data) : "Giriş başarısız.")); 
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const avatar = req.session.user.avatar ? `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    res.send(ui(`
        <div class="user-pill">
            <img src="${avatar}">
            <div>
                <div style="font-size:11px; color:#e30613; font-weight:800; letter-spacing:1px">DİJİTAL TARAFTAR</div>
                <div style="font-size:20px; font-weight:900; color:#1a1a1a">${req.session.user.username}</div>
            </div>
        </div>
        <p>Bilet tanımlamak istediğiniz stadyum veya sunucuyu seçin.</p>
        <select><option>Sunucu Seçiniz...</option></select>
        <button class="btn-action" style="background:#e30613; box-shadow: 0 8px 25px rgba(227,6,19,0.3);">MAÇLARI LİSTELE</button>
    `));
});

module.exports = app;

const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || 'ropasso-gizli-key',
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
            background-color: #f0f2f5; 
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            margin: 0; 
            display: flex; 
            flex-direction: column; 
            min-height: 100vh;
        }
        .header { 
            background-color: #e30613; 
            width: 100%; 
            padding: 12px 0; 
            display: flex; 
            justify-content: center; 
            box-shadow: 0 4px 12px rgba(227, 6, 19, 0.2);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .header img { height: 60px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
        .main-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card { 
            background: white; 
            padding: 40px 30px; 
            border-radius: 24px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.08); 
            text-align: center; 
            width: 100%; 
            max-width: 420px; 
            border-top: 10px solid #e30613;
            animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        h2 { color: #1a1a1a; margin-bottom: 15px; font-size: 28px; letter-spacing: -0.5px; }
        p { color: #5f6368; line-height: 1.6; font-size: 15px; margin-bottom: 30px; }
        .btn-discord { 
            background-color: #5865F2; 
            color: white; 
            padding: 16px 24px; 
            text-decoration: none; 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: 700; 
            font-size: 16px;
            transition: all 0.2s ease; 
            border: none; 
            cursor: pointer;
            width: 100%;
        }
        .btn-discord img { height: 24px; margin-right: 12px; }
        .btn-discord:hover { background-color: #4752c4; transform: scale(1.02); box-shadow: 0 8px 20px rgba(88,101,242,0.3); }
        .user-box {
            display: flex;
            align-items: center;
            background: #fff5f5;
            padding: 15px;
            border-radius: 16px;
            margin-bottom: 25px;
            border: 1px solid #ffebeb;
        }
        .user-box img { width: 50px; height: 50px; border-radius: 50%; border: 3px solid #e30613; margin-right: 15px; }
        .footer { padding: 20px; color: #9aa0a6; font-size: 12px; text-align: center; font-weight: 600; }
        select {
            width: 100%;
            padding: 14px;
            border-radius: 12px;
            border: 2px solid #eee;
            margin-bottom: 20px;
            font-size: 16px;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div class="header"><img src="${LOGO_URL}"></div>
    <div class="main-content">
        <div class="card">${body}</div>
    </div>
    <div class="footer">ROPASSO DIGITAL TICKETING SYSTEM 2026</div>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(ui(`
        <h2>Hoş Geldiniz</h2>
        <p>Maçlara ve sunucu etkinliklerine giriş yapmak için hesabınızı bağlayın.</p>
        <a href="/login" class="btn-discord">
            <img src="${DISCORD_ICON}"> Discord ile Giriş Yap
        </a>
    `));
});

app.get('/login', (req, res) => {
    // BURADAKİ DEĞİŞKENLERİN VERCEL'DE OLDUĞUNDAN EMİN OL
    const clientID = process.env.DISCORD_CLIENT_ID;
    const redirectURI = process.env.DISCORD_REDIRECT_URI;
    
    if(!clientID || !redirectURI) return res.send("Hata: Vercel Environment Variables eksik!");

    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientID}&redirect_uri=${encodeURIComponent(redirectURI)}&response_type=code&scope=identify%20guilds`;
    res.redirect(url);
});

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_TOKEN, // SENİN DEĞİŞKENİN
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
        console.error(err.response ? err.response.data : err.message);
        res.send("Hata: " + (err.response ? JSON.stringify(err.response.data) : "Giriş yapılamadı.")); 
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const avatar = req.session.user.avatar ? `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    res.send(ui(`
        <div class="user-box">
            <img src="${avatar}">
            <div style="text-align:left">
                <div style="font-size:12px; color:#e30613; font-weight:700">TARAFTAR PROFILI</div>
                <div style="font-size:18px; font-weight:800">${req.session.user.username}</div>
            </div>
        </div>
        <p>Biletini kullanmak istediğin sunucuyu seç.</p>
        <select><option>Aktif Sunucular...</option></select>
        <button class="btn-discord" style="background:#e30613">ETKINLIKLERI LISTELE</button>
    `));
});

module.exports = app;

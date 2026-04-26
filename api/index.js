const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(session({
    secret: 'ropasso-premium-key-2026',
    resave: false,
    saveUninitialized: false
}));

const LOGO_URL = "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png?ex=69ef49ba&is=69edf83a&hm=907abaa3475f136cc06c14450bf639e3c3d355b398a8e30e7736e06ab4453ba3&";
const DISCORD_ICON = "https://cdn.discordapp.com/attachments/1497741754777079829/1497743438798389268/39-393163_company-discord-logo-png-white-Photoroom.png?ex=69ef4a86&is=69edf906&hm=598c2232e1889a0024cd3a1c63f772b7cce2082d82773b2da9bd8140cecb0305&";
const SITE_ICON = "https://cdn.discordapp.com/attachments/1495543284423065662/1497925916968620063/indir_1.png?ex=69ef4bb8&is=69edfa38&hm=ad460d965721a334d39ec82186fc986fbd90e38da1577826d2beb3a91116762c&";

// Senin tam yetki linkin
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=1497727912978153482&permissions=8&response_type=code&redirect_uri=https%3A%2F%2Fropasso.vercel.app%2Fapi%2Fauth%2Fcallback&integration_type=0&scope=identify+guilds.members.read+guilds+bot+applications.commands`;

const ui = (body) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="${SITE_ICON}">
    <title>RoPasso | Dijital Bilet Sistemi</title>
    <style>
        * { box-sizing: border-box; outline: none; }
        body { 
            background-color: #0f0f0f; 
            font-family: 'Inter', system-ui, sans-serif; 
            margin: 0; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
            color: #fff;
        }
        .main-container { 
            background: #1a1a1a; 
            width: 100%; 
            max-width: 450px; 
            padding: 50px 40px; 
            border-radius: 40px; 
            text-align: center;
            box-shadow: 0 40px 100px rgba(0,0,0,0.5);
            border: 1px solid #222;
        }
        .brand-logo { 
            width: 180px; /* Logoyu büyüttüm */
            height: auto; 
            margin-bottom: 30px;
            filter: drop-shadow(0 0 15px rgba(227, 6, 19, 0.2));
        }
        h2 { font-size: 30px; font-weight: 800; margin: 0 0 10px; color: #fff; }
        p { color: #888; font-size: 16px; margin-bottom: 40px; line-height: 1.5; }
        .btn { 
            background: #e30613; 
            color: white; 
            padding: 20px; 
            text-decoration: none; 
            border-radius: 20px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: 700; 
            font-size: 18px;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            width: 100%;
            cursor: pointer;
        }
        .btn:hover { background: #ff0818; transform: scale(1.02); }
        .btn img { height: 24px; margin-right: 12px; }
        .btn.discord { background: #5865F2; margin-bottom: 15px; }
        .btn.discord:hover { background: #4752c4; }
        
        .user-card {
            background: #252525;
            padding: 20px;
            border-radius: 25px;
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            text-align: left;
            border: 1px solid #333;
        }
        .user-card img { width: 60px; height: 60px; border-radius: 50%; margin-right: 20px; border: 2px solid #e30613; }
        .user-card span { font-size: 12px; color: #e30613; font-weight: bold; text-transform: uppercase; }
        .user-card div h3 { margin: 2px 0 0; font-size: 20px; color: #fff; }
        
        select {
            width: 100%;
            padding: 18px;
            border-radius: 18px;
            border: 1px solid #333;
            background: #252525;
            color: #fff;
            font-size: 16px;
            margin-bottom: 20px;
            appearance: none;
        }
        .footer { margin-top: 40px; color: #444; font-size: 11px; font-weight: bold; letter-spacing: 2px; }
    </style>
</head>
<body>
    <div class="main-container">
        <img src="${LOGO_URL}" class="brand-logo" alt="RoPasso">
        ${body}
        <div class="footer">ROPASSO DIGITAL TICKETING 2026</div>
    </div>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(ui(`
        <h2>Hoş Geldiniz</h2>
        <p>Biletlerini yönetmek ve maçlara giriş yapmak için Discord hesabını doğrula.</p>
        <a href="${DISCORD_AUTH_URL}" class="btn discord">
            <img src="${DISCORD_ICON}"> Discord ile Giriş Yap
        </a>
    `));
});

app.get('/login', (req, res) => {
    res.redirect(DISCORD_AUTH_URL);
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
        res.send("Giriş başarısız. Lütfen Vercel ayarlarını kontrol et kanka.");
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const avatar = req.session.user.avatar ? `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    res.send(ui(`
        <div class="user-card">
            <img src="${avatar}">
            <div>
                <span>Sistem Kaydı Aktif</span>
                <h3>${req.session.user.username}</h3>
            </div>
        </div>
        <p>Bilet tanımlamak istediğin stadyumu listeden seç.</p>
        <select>
            <option>Stadyum / Sunucu Seçiniz...</option>
            <option>Eryaman Stadyumu</option>
        </select>
        <button class="btn">MAÇLARI LİSTELE</button>
    `));
});

module.exports = app;

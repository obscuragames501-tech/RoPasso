const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(session({
    secret: 'ropasso-final-premium-2026',
    resave: false,
    saveUninitialized: false
}));

// ASSET VE LOGO TANIMLARI
const LOGO_URL = "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png?ex=69ef49ba&is=69edf83a&hm=907abaa3475f136cc06c14450bf639e3c3d355b398a8e30e7736e06ab4453ba3&";
const DISCORD_ICON = "https://cdn.discordapp.com/attachments/1497741754777079829/1497743438798389268/39-393163_company-discord-logo-png-white-Photoroom.png?ex=69ef4a86&is=69edf906&hm=598c2232e1889a0024cd3a1c63f772b7cce2082d82773b2da9bd8140cecb0305&";
const SITE_ICON = "https://cdn.discordapp.com/attachments/1495543284423065662/1497925916968620063/indir_1.png?ex=69ef4bb8&is=69edfa38&hm=ad460d965721a334d39ec82186fc986fbd90e38da1577826d2beb3a91116762c&";

// VERCEL DEĞİŞKENLERİ
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1497727912978153482";
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "https://ropasso.vercel.app/api/auth/callback";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`;

// GELİŞTİRİLMİŞ KIRMIZI-BEYAZ UI TEMPLATE
const ui = (body) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="${SITE_ICON}">
    <title>RoPasso | Dijital Bilet Sistemi</title>
    <style>
        :root { --primary: #e30613; --bg: #f4f7f6; }
        * { box-sizing: border-box; outline: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        body { 
            background: linear-gradient(135deg, #fdfdfd 0%, #ebebeb 100%);
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh;
        }
        .main-card { 
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            width: 100%; max-width: 440px; padding: 50px 35px; border-radius: 40px;
            text-align: center; box-shadow: 0 25px 50px -12px rgba(227, 6, 19, 0.15);
            border: 1px solid rgba(227, 6, 19, 0.05);
            position: relative; overflow: hidden;
        }
        .main-card::before {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: var(--primary);
        }
        .logo-area { margin-bottom: 40px; }
        .main-logo { width: 260px; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1)); }
        
        h2 { font-size: 32px; color: #111; margin: 0 0 12px; font-weight: 900; letter-spacing: -1px; }
        p { color: #555; font-size: 16px; margin-bottom: 40px; font-weight: 500; }

        .btn { 
            background: var(--primary); color: white; padding: 20px; text-decoration: none;
            border-radius: 20px; display: flex; align-items: center; justify-content: center;
            font-weight: 750; font-size: 18px; border: none; width: 100%; cursor: pointer;
            box-shadow: 0 10px 25px rgba(227, 6, 19, 0.3);
        }
        .btn:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 15px 30px rgba(227, 6, 19, 0.4); }
        .btn:active { transform: scale(0.98); }
        .btn img { height: 24px; margin-right: 14px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
        
        .btn.discord { background: #5865F2; box-shadow: 0 10px 25px rgba(88, 101, 242, 0.3); }
        .btn.discord:hover { background: #4752c4; box-shadow: 0 15px 30px rgba(88, 101, 242, 0.4); }

        .user-panel {
            background: #fff; border-radius: 25px; padding: 25px; display: flex; align-items: center;
            margin-bottom: 30px; text-align: left; border: 2px solid #f0f0f0; box-shadow: 0 5px 15px rgba(0,0,0,0.02);
        }
        .user-panel img { width: 65px; height: 65px; border-radius: 20px; margin-right: 20px; border: 4px solid var(--primary); }
        .user-info span { display: block; font-size: 12px; color: var(--primary); font-weight: 900; letter-spacing: 2px; }
        .user-info h3 { margin: 2px 0 0; font-size: 22px; color: #1a1a1a; font-weight: 800; }

        select {
            width: 100%; padding: 18px; border-radius: 18px; border: 2px solid #eee;
            background: #fff; color: #1a1a1a; font-size: 16px; margin-bottom: 25px;
            font-weight: 700; cursor: pointer; -webkit-appearance: none;
        }
        select:focus { border-color: var(--primary); }

        .footer { margin-top: 40px; color: #bbb; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
        .success-badge { display: inline-flex; align-items: center; background: #e8f5e9; color: #2e7d32; padding: 8px 16px; border-radius: 50px; font-size: 14px; font-weight: 800; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="main-card">
        <div class="logo-area">
            <img src="${LOGO_URL}" class="main-logo" alt="RoPasso">
        </div>
        ${body}
        <div class="footer">ROPASSO DIGITAL TICKETING 2026</div>
    </div>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(ui(`
        <h2>Hoş Geldiniz</h2>
        <p>Biletlerinize erişmek ve stadyum giriş yetkisi almak için hesabınızı bağlayın.</p>
        <a href="${DISCORD_AUTH_URL}" class="btn discord">
            <img src="${DISCORD_ICON}"> Discord ile Kimlik Doğrula
        </a>
    `));
});

app.get('/login', (req, res) => res.redirect(DISCORD_AUTH_URL));

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!CLIENT_SECRET) return res.status(500).send("HATA: DISCORD_CLIENT_SECRET Vercel'e eklenmemiş!");

    try {
        const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const user = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${response.data.access_token}` }
        });

        req.session.user = user.data;
        res.redirect('/dashboard');
    } catch (err) {
        res.status(500).send(ui(`
            <h2 style="color: #e30613;">Bağlantı Hatası!</h2>
            <p>Vercel ayarlarındaki Client Secret veya Redirect URI geçersiz.</p>
            <a href="/" class="btn">Tekrar Dene</a>
        `));
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const avatar = req.session.user.avatar ? `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    res.send(ui(`
        <div class="success-badge">✓ SİSTEM DOĞRULANDI</div>
        <div class="user-panel">
            <img src="${avatar}">
            <div class="user-info">
                <span>DİJİTAL TARAFTAR</span>
                <h3>${req.session.user.username}</h3>
            </div>
        </div>
        <p>Biletini aktif etmek istediğin stadyumu seçerek işlemlere devam et.</p>
        <select>
            <option>Eryaman Stadyumu</option>
        </select>
        <button class="btn" onclick="alert('Maçlar yakında listelenecek!')">MAÇLARI LİSTELE</button>
    `));
});

module.exports = app;

const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(session({
    secret: 'ropasso-final-secure-2026',
    resave: false,
    saveUninitialized: false
}));

const LOGO_URL = "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png?ex=69ef49ba&is=69edf83a&hm=907abaa3475f136cc06c14450bf639e3c3d355b398a8e30e7736e06ab4453ba3&";
const DISCORD_ICON = "https://cdn.discordapp.com/attachments/1497741754777079829/1497743438798389268/39-393163_company-discord-logo-png-white-Photoroom.png?ex=69ef4a86&is=69edf906&hm=598c2232e1889a0024cd3a1c63f772b7cce2082d82773b2da9bd8140cecb0305&";
const SITE_ICON = "https://cdn.discordapp.com/attachments/1495543284423065662/1497925916968620063/indir_1.png?ex=69ef4bb8&is=69edfa38&hm=ad460d965721a334d39ec82186fc986fbd90e38da1577826d2beb3a91116762c&";

// GÜNCELLENMİŞ HESAP ERİŞİM LİNKİ (BOT EKLEME EKRANI ÇIKMAZ)
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=1497727912978153482&response_type=code&redirect_uri=https%3A%2F%2Fropasso.vercel.app%2Fapi%2Fauth%2Fcallback&scope=identify+guilds.members.read+guilds`;

const ui = (body) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="${SITE_ICON}">
    <title>RoPasso | Dijital Bilet</title>
    <style>
        * { box-sizing: border-box; outline: none; transition: all 0.2s ease; }
        body { 
            background-color: #f8f9fa; 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            margin: 0; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh;
        }
        .main-card { 
            background: white; 
            width: 100%; 
            max-width: 420px; 
            padding: 40px 30px; 
            border-radius: 35px; 
            text-align: center;
            box-shadow: 0 15px 35px rgba(0,0,0,0.08);
            border-bottom: 10px solid #e30613;
        }
        .logo-wrap {
            margin-bottom: 25px;
        }
        .main-logo { 
            width: 240px; /* Dev gibi yaptık */
            height: auto; 
            filter: drop-shadow(0 5px 15px rgba(0,0,0,0.05));
        }
        h2 { font-size: 28px; color: #1a1a1a; margin: 0 0 10px; font-weight: 800; letter-spacing: -0.5px; }
        p { color: #6c757d; font-size: 16px; margin-bottom: 35px; line-height: 1.5; }
        
        .btn { 
            background: #e30613; 
            color: white; 
            padding: 18px; 
            text-decoration: none; 
            border-radius: 16px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-weight: 700; 
            font-size: 18px;
            border: none;
            width: 100%;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(227,6,19,0.2);
        }
        .btn:hover { background: #c20510; transform: translateY(-2px); }
        .btn img { height: 22px; margin-right: 12px; }
        .btn.discord { background: #5865F2; margin-bottom: 15px; box-shadow: 0 8px 20px rgba(88,101,242,0.2); }
        .btn.discord:hover { background: #4752c4; }
        
        .user-box {
            background: #fff5f5;
            padding: 20px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            margin-bottom: 25px;
            text-align: left;
            border: 1px solid #ffebeb;
        }
        .user-box img { width: 55px; height: 55px; border-radius: 50%; margin-right: 15px; border: 3px solid #e30613; }
        .user-box .meta { display: flex; flex-direction: column; }
        .user-box span { font-size: 11px; color: #e30613; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .user-box h3 { margin: 0; font-size: 20px; color: #1a1a1a; font-weight: 800; }
        
        select {
            width: 100%;
            padding: 16px;
            border-radius: 14px;
            border: 2px solid #eee;
            background: #fafafa;
            color: #333;
            font-size: 16px;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .footer-text { margin-top: 35px; color: #ced4da; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
    </style>
</head>
<body>
    <div class="main-card">
        <div class="logo-wrap">
            <img src="${LOGO_URL}" class="main-logo" alt="RoPasso">
        </div>
        ${body}
        <div class="footer-text">ROPASSO DIGITAL SYSTEM 2026</div>
    </div>
</body>
</html>`;

app.get('/', (req, res) => {
    res.send(ui(`
        <h2>Hoş Geldiniz</h2>
        <p>Maç biletlerinizi görüntülemek ve stadyuma giriş yapmak için hesabınızı doğrulayın.</p>
        <a href="${DISCORD_AUTH_URL}" class="btn discord">
            <img src="${DISCORD_ICON}"> Discord ile Bağlan
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
        res.send("Hata: Giriş yetkisi alınamadı. Vercel Variables kısmını kontrol edin.");
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const avatar = req.session.user.avatar ? `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    res.send(ui(`
        <div class="user-box">
            <img src="${avatar}">
            <div class="meta">
                <span>Dijital Taraftar</span>
                <h3>${req.session.user.username}</h3>
            </div>
        </div>
        <p>Biletinizi aktif etmek istediğiniz sunucuyu seçin.</p>
        <select>
            <option>Bir Sunucu Seçin...</option>
            <option>Eryaman Stadyumu</option>
        </select>
        <button class="btn">MAÇLARI LİSTELE</button>
    `));
});

module.exports = app;

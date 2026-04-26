const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ropasso-final-ultra-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    DISCORD: "https://cdn.discordapp.com/attachments/1497741754777079829/1497743438798389268/39-393163_company-discord-logo-png-white-Photoroom.png",
    ROBLOX: "https://cdn.discordapp.com/attachments/1497741754777079829/1497937507419951225/Roblox_Logo_2025.png",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png",
    FOUNDER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937318336528446/noFilter.png",
    ID_TUTORIAL: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935107258843247/image.png",
    URL_TUTORIAL: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935416429383801/image.png"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png"
};

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1497727912978153482";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "https://ropasso.vercel.app/api/auth/callback";
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`;

let db_cards = {};

const ui = (body, user = null, activePage = 'home') => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Dijital Futbol Dünyası</title>
    <style>
        :root { --primary: #e30613; --bg: #f8f9fa; --sidebar: #ffffff; }
        * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; transition: 0.2s; }
        body { background: var(--bg); display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        .topbar { background: #fff; height: 70px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; flex-shrink: 0; }
        .main-layout { display: flex; flex: 1; overflow: hidden; }
        
        .sidebar { width: 260px; background: var(--sidebar); border-right: 1px solid #eee; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .content { flex: 1; overflow-y: auto; padding: 40px; }

        .nav-item { padding: 15px 20px; border-radius: 12px; text-decoration: none; color: #555; font-weight: 600; display: flex; align-items: center; gap: 10px; }
        .nav-item:hover { background: #f0f0f0; }
        .nav-item.active { background: var(--primary); color: white; }

        .card-showcase-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .showcase-item { border-radius: 15px; overflow: hidden; border: 2px solid transparent; cursor: pointer; position: relative; }
        .showcase-item img { width: 100%; display: block; }
        .showcase-item.selected { border-color: var(--primary); box-shadow: 0 0 15px rgba(227, 6, 19, 0.3); }

        .glass-panel { background: #fff; border-radius: 20px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .btn-main { background: var(--primary); color: white; border: none; padding: 15px 30px; border-radius: 10px; font-weight: 700; cursor: pointer; width: 100%; font-size: 16px; }
        .btn-main:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(227, 6, 19, 0.3); }

        .passo-card-render { position: relative; width: 400px; aspect-ratio: 1.58/1; border-radius: 20px; overflow: hidden; margin: 20px auto; color: white; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .card-info-overlay { position: absolute; bottom: 20px; left: 20px; display: flex; align-items: center; gap: 15px; text-align: left; }
        .card-pfp { width: 65px; height: 65px; border-radius: 50%; border: 3px solid white; background: #333; }

        .news-banner { width: 100%; height: 350px; border-radius: 25px; background: url('${ASSETS.NEWS_BANNER}') center/cover; position: relative; margin-bottom: 30px; display: flex; align-items: flex-end; padding: 40px; color: white; }
        .news-banner::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); border-radius: 25px; }
        .news-text { position: relative; z-index: 1; }

        .tutorial-img { width: 100%; border-radius: 10px; margin: 10px 0; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="topbar">
        <img src="${ASSETS.PASSO_NAV}" height="35" onclick="location.href='/dashboard'">
        <div style="display:flex; align-items:center; gap:15px;">
            <span style="font-weight:700;">${user ? user.username : 'Giriş Yapılmadı'}</span>
            ${user ? `<a href="/logout" style="color:var(--primary); font-weight:700; text-decoration:none; font-size:14px;">ÇIKIŞ</a>` : ''}
        </div>
    </div>

    <div class="main-layout">
        <div class="sidebar">
            <a href="/dashboard" class="nav-item ${activePage === 'home' ? 'active' : ''}">ANA SAYFA</a>
            <a href="/my-cards" class="nav-item ${activePage === 'cards' ? 'active' : ''}">KARTLARIM</a>
            <a href="/create-card" class="nav-item ${activePage === 'create' ? 'active' : ''}">KART OLUŞTUR</a>
            <div style="margin-top:auto; padding:20px; background:#f9f9f9; border-radius:15px; text-align:center;">
                <img src="${ASSETS.FOUNDER}" style="width:60px; height:60px; border-radius:50%; margin-bottom:10px; border: 2px solid var(--primary);">
                <div style="font-weight:800; font-size:14px;">Xe1lea (Pundk)</div>
                <div style="font-size:11px; color:#888;">System Developer</div>
            </div>
        </div>
        <div class="content">
            ${body}
        </div>
    </div>
</body>
</html>`;

// --- ROUTES ---

app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.send(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>RoPasso Login</title><style>
        body { background: #f4f4f4; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
        .login-box { background: white; padding: 50px; border-radius: 30px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 400px; }
        .btn { background: #5865F2; color: white; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: 800; display: block; margin-top: 20px; }
    </style></head><body><div class="login-box"><img src="${ASSETS.LOGO}" width="200"><br><h1>Hoş Geldiniz</h1><p>Sistemi kullanmak için giriş yapın.</p><a href="${DISCORD_AUTH_URL}" class="btn">Discord ile Giriş</a></div></body></html>`);
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="news-banner">
            <div class="news-text">
                <h1 style="font-size:42px; font-weight:900;">RoPasso Yayında!</h1>
                <p>Türkiye'nin en gelişmiş Roblox taraftar sistemi ile stadyumda yerinizi alın.</p>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
            <div class="glass-panel">
                <h3>Sistem Bilgileri</h3>
                <p style="margin:15px 0; color:#666; line-height:1.6;">RoPasso, Eryaman Stadyumu ve diğer tüm anlaşmalı sahalarda geçerli olan dijital biletleme sistemidir. Kartınızı oluşturduktan sonra maç biletlerinizi bu panelden yönetebilirsiniz.</p>
                <ul style="list-style:none; font-weight:600; color:#444;">
                    <li>✓ Ücretsiz Dijital Kart</li>
                    <li>✓ Anlık Bilet Kontrolü</li>
                    <li>✓ Roblox Entegrasyonu</li>
                </ul>
            </div>
            <div class="glass-panel">
                <h3>Duyurular</h3>
                <div style="padding:10px; border-left:4px solid var(--primary); background:#fff5f5; margin-bottom:10px;">
                    <b>Versiyon 2.0 Güncellemesi</b><br><small>Showcase sistemi ve yeni kart tasarımları eklendi!</small>
                </div>
            </div>
        </div>
    `, req.session.user, 'home'));
});

app.get('/create-card', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="glass-panel" style="max-width:800px; margin:0 auto;">
            <h2 style="margin-bottom:20px; text-align:center;">Yeni Kart Başvurusu</h2>
            <form action="/apply-card" method="POST">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                    <div>
                        <label style="font-weight:700; display:block; margin-bottom:5px;">Roblox İsmi</label>
                        <input type="text" name="roblox_name" style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd;" required>
                        
                        <label style="font-weight:700; display:block; margin-top:15px; margin-bottom:5px;">Roblox User ID</label>
                        <input type="text" name="roblox_id" style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd;" required>
                        <img src="${ASSETS.ID_TUTORIAL}" class="tutorial-img">

                        <label style="font-weight:700; display:block; margin-top:15px; margin-bottom:5px;">Discord URL</label>
                        <input type="text" name="discord_url" style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd;" required>
                        <img src="${ASSETS.URL_TUTORIAL}" class="tutorial-img">
                    </div>
                    <div>
                        <label style="font-weight:700; display:block; margin-bottom:10px;">Kart Tasarımı Seç (Showcase)</label>
                        <div class="card-showcase-grid">
                            <label class="showcase-item selected"><input type="radio" name="card_style" value="RED" checked style="display:none;"><img src="${CARDS.RED}"><center><small>KLASİK</small></center></label>
                            <label class="showcase-item"><input type="radio" name="card_style" value="BLACK" style="display:none;"><img src="${CARDS.BLACK}"><center><small>SİYAH</small></center></label>
                            <label class="showcase-item"><input type="radio" name="card_style" value="PATTERN" style="display:none;"><img src="${CARDS.PATTERN}"><center><small>DESENLİ</small></center></label>
                        </div>
                        <div style="background:#eee; padding:15px; border-radius:10px; font-size:12px; margin-top:20px;">
                            <b>Bilgilendirme:</b><br>Eğer hesabınızı değiştirirseniz kartınızı iptal edip yeniden çıkartmanız gerekebilir.
                        </div>
                        <button class="btn-main" style="margin-top:20px;">KARTI ONAYLA VE ÇIKART</button>
                    </div>
                </div>
            </form>
        </div>
    `, req.session.user, 'create'));
});

app.get('/my-cards', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const userCard = db_cards[req.session.user.id];
    if (!userCard) return res.send(ui('<h2>Henüz bir kartın yok.</h2><a href="/create-card" class="btn-main" style="display:inline-block; width:auto; text-decoration:none; margin-top:20px;">Hemen Oluştur</a>', req.session.user, 'cards'));
    
    const headshot = `https://www.roblox.com/headshot-thumbnail/image?userId=${userCard.id}&width=420&height=420&format=png`;
    res.send(ui(`
        <div class="glass-panel" style="text-align:center;">
            <h1>Dijital Kartlarım</h1>
            <div class="passo-card-render">
                <img src="${CARDS[userCard.style]}" style="width:100%;">
                <div class="card-info-overlay">
                    <img src="${headshot}" class="card-pfp" onerror="this.src='${ASSETS.FOUNDER}'">
                    <div>
                        <div style="font-size:18px; font-weight:900; text-transform:uppercase;">${userCard.name}</div>
                        <div style="font-size:12px; opacity:0.8;">ROBLOX TARAFTAR KARTI</div>
                    </div>
                </div>
            </div>
            <p style="margin-top:20px; font-weight:700; color:#2e7d32;">DURUM: AKTİF</p>
            <button onclick="location.href='/cancel-card'" style="background:#333; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; margin-top:20px;">KARTI İPTAL ET</button>
        </div>
    `, req.session.user, 'cards'));
});

app.post('/apply-card', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    db_cards[req.session.user.id] = { name: req.body.roblox_name, id: req.body.roblox_id, style: req.body.card_style };
    res.redirect('/my-cards');
});

app.get('/cancel-card', (req, res) => {
    if (req.session.user) delete db_cards[req.session.user.id];
    res.redirect('/create-card');
});

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const user = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        req.session.user = user.data;
        res.redirect('/dashboard');
    } catch (e) { res.redirect('/'); }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

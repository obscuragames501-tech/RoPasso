const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ropasso-ultra-v2-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- ASSETS (SİMGELER İÇİN HIZLI KONTROL ET) ---
const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    ERROR: "https://www.freeiconspng.com/thumbs/error-icon/error-icon-4.png",
    BOT_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497738166235430972/Gemini_Generated_Image_o1s4jao1s4jao1s4.png",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png",
    ROBLOX_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935107258843247/image.png",
    DISCORD_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935416429383801/image.png"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png"
};

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1497727912978153482";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "https://ropasso.vercel.app/api/auth/callback";
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`;
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&integration_type=0&scope=identify+guilds.members.read+guilds+bot+applications.commands`;

// --- DATABASE SIMULATION ---
let db_cards = {};
let db_tickets = {};
let db_announcements = [
    { id: 1, title: "Sistem Güncellemesi", content: "Passo V2 altyapısına geçiş yapıldı. Tüm kartlar artık Roblox üzerinden otomatik doğrulanıyor.", date: "26.04.2026" },
    { id: 2, title: "Eryaman Stadyumu Hakkında", content: "Ankaragücü maçları için bilet satışları 2 saat önce açılacaktır.", date: "25.04.2026" }
];

// MAÇLARA guildId EKLEDİM (Sunucu bazlı ayırmak için)
let db_matches = [
    { id: "match_1", guildId: "123456789", home: "Ankaragücü", away: "Beşiktaş", stadium: "Eryaman Stadyumu", time: "20:00", date: "28.04.2026", status: "BİLET VAR", invite: "https://discord.gg/ankaragucu" },
    { id: "match_2", guildId: "987654321", home: "Ankaragücü", away: "Galatasaray", stadium: "Eryaman Stadyumu", time: "19:00", date: "02.05.2026", status: "YAKINDA", invite: "https://discord.gg/ankaragucu" }
];

// --- ARAYÜZ ŞABLONU (DOKUNULMADI, SADECE CSS FIX) ---
const ui = (body, user = null, activePage = 'home') => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Yönetim Paneli</title>
    <style>
        :root { --primary: #e30613; --secondary: #1d1d1f; --bg: #f2f2f7; --glass: rgba(255, 255, 255, 0.8); }
        * { box-sizing: border-box; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { margin: 0; background: var(--bg); overflow-y: auto; color: var(--secondary); scroll-behavior: smooth; }
        
        .navbar { background: var(--glass); backdrop-filter: blur(20px); height: 75px; display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 1000; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-link { text-decoration: none; color: #666; font-weight: 600; font-size: 14px; transition: 0.2s; cursor: pointer; padding: 10px 0; }
        .nav-link:hover, .nav-link.active { color: var(--primary); }
        .nav-btn { background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; border: none; cursor: pointer; display: inline-block; }
        .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(227,6,19,0.3); }

        /* DROPDOWN FIX */
        .dropdown { position: relative; display: inline-block; }
        .dropdown-content { display: none; position: absolute; background: white; min-width: 250px; border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); z-index: 1001; margin-top: 0; border: 1px solid #eee; overflow: hidden; top: 100%; }
        .dropdown:hover .dropdown-content { display: block; animation: slideUp 0.3s ease; }
        .dropdown-item { padding: 15px 20px; text-decoration: none; color: #333; display: flex; align-items: center; gap: 10px; font-weight: 600; border-bottom: 1px solid #f9f9f9; }
        .dropdown-item:hover { background: #f8f8f8; color: var(--primary); }

        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: #fff; border-radius: 28px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); margin-bottom: 30px; border: 1px solid rgba(0,0,0,0.02); }

        /* HERO AREA */
        .hero { position: relative; height: 450px; border-radius: 35px; overflow: hidden; margin-bottom: 40px; background: url('${ASSETS.NEWS_BANNER}') center/cover; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; color: white; }

        .final-card { position: relative; width: 450px; height: 284px; border-radius: 22px; overflow: hidden; margin: 30px auto; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
        .final-card-user { position: absolute; bottom: 30px; left: 30px; display: flex; align-items: center; gap: 18px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .final-card-avatar { width: 85px; height: 85px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; background: #222; }

        .input-box { width: 100%; padding: 16px; border-radius: 14px; border: 2px solid #eee; margin-top: 8px; font-size: 16px; transition: 0.3s; }
        .input-box:focus { border-color: var(--primary); outline: none; background: #fff; }

        .match-row { display: flex; align-items: center; justify-content: space-between; padding: 20px; border-bottom: 1px solid #f0f0f0; transition: 0.3s; }
        .match-row:hover { background: #fafafa; }
        .team-info { display: flex; align-items: center; gap: 20px; flex: 1; }
        .match-badge { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; background: #eee; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="navbar">
        <div style="display:flex; align-items:center; gap:20px;">
            <img src="${ASSETS.PASSO_NAV}" height="32" onclick="location.href='/dashboard'" style="cursor:pointer">
            <a href="/add-bot" class="nav-btn" style="background:#5865F2; font-size:12px;">BOTU SUNUCUNA EKLE</a>
        </div>
        <div class="nav-links">
            <a href="/dashboard" class="nav-link ${activePage==='home'?'active':''}">Ana Sayfa</a>
            <div class="dropdown">
                <span class="nav-link ${activePage==='servers'?'active':''}">Sunucu Seç ▼</span>
                <div class="dropdown-content">
                    ${user && user.guilds && user.guilds.length > 0 ? user.guilds.map(g => `<a href="/server/${g.id}" class="dropdown-item"><b>#</b> ${g.name}</a>`).join('') : '<div class="dropdown-item">Sunucu Bulunamadı</div>'}
                </div>
            </div>
            <a href="/matches" class="nav-link ${activePage==='matches'?'active':''}">Maçlar</a>
            <a href="/my-cards" class="nav-link ${activePage==='cards'?'active':''}">Kartlarım</a>
            <a href="/apply" class="nav-link ${activePage==='apply'?'active':''}">Başvuru</a>
            ${user ? `<a href="/logout" class="nav-btn" style="background:#333;">Çıkış Yap</a>` : `<a href="/login" class="nav-btn">Giriş Yap</a>`}
        </div>
    </div>
    <div class="container">
        ${body}
    </div>
</body>
</html>`;

// --- ROUTES ---

// ANA SAYFA VE DİĞERLERİ DEĞİŞMEDİ
app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.send(ui(`
        <div style="text-align:center; padding: 100px 0;">
            <img src="${ASSETS.LOGO}" width="300" style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));">
            <h1 style="font-size:55px; font-weight:900; letter-spacing:-2px; margin: 20px 0;">Yeni Nesil Passo</h1>
            <p style="color:#666; font-size:20px; max-width:600px; margin: 0 auto 40px auto;">Roblox stadyumlarına tek tıkla bilet al, taraftar kartını cüzdanına ekle.</p>
            <a href="${DISCORD_AUTH_URL}" class="nav-btn" style="padding: 20px 50px; font-size:18px; background:#5865F2;">Discord ile Giriş Yap</a>
        </div>
    `));
});

// SUNUCU ÖZEL MAÇLARI
app.get('/server/:guildId', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const guild = req.session.user.guilds.find(g => g.id === req.params.guildId);
    if (!guild) return res.redirect('/dashboard');

    const serverMatches = db_matches.filter(m => m.guildId === req.params.guildId);

    let matchesHtml = serverMatches.length > 0 ? serverMatches.map(m => `
        <div class="match-row">
            <div class="team-info">
                <strong>${m.home} VS ${m.away}</strong>
            </div>
            <div style="flex:1; text-align:center;">${m.stadium}<br>${m.date}</div>
            <a href="/buy/${m.id}" class="nav-btn" style="padding:8px 20px;">BİLET AL</a>
        </div>
    `).join('') : '<p style="text-align:center; padding:20px;">Bu sunucuda aktif maç bulunmuyor.</p>';

    res.send(ui(`
        <div class="glass-card">
            <h2># ${guild.name} Maçları</h2>
            ${matchesHtml}
        </div>
    `, req.session.user, 'servers'));
});

// GLOBAL MAÇLAR (BOTUN OLDUĞU TÜM SUNUCULAR)
app.get('/matches', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    
    let matchesHtml = db_matches.map(m => {
        const userInGuild = req.session.user.guilds.some(g => g.id === m.guildId);
        return `
        <div class="match-row">
            <div class="team-info"><strong>${m.home} VS ${m.away}</strong></div>
            <div style="flex:1; text-align:center;">${m.stadium}</div>
            <div style="flex:1; text-align:right;">
                ${userInGuild ? `<a href="/buy/${m.id}" class="nav-btn">BİLET AL</a>` : `<a href="${m.invite}" target="_blank" class="nav-btn" style="background:#5865F2;">SUNUCUYA KATIL</a>`}
            </div>
        </div>
    `}).join('');

    res.send(ui(`<div class="glass-card"><h2>Global Maç Havuzu</h2>${matchesHtml}</div>`, req.session.user, 'matches'));
});

// AUTH HANDLERS (GÜNCELLENDİ: Sadece botun olduğu sunucuları getirir)
app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        
        const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        
        // ÖNEMLİ: db_matches'ta tanımlı sunucular veya admin olduğu sunucuları filtrele
        const botGuilds = db_matches.map(m => m.guildId);
        const filteredGuilds = guildsRes.data.filter(g => botGuilds.includes(g.id) || (g.permissions & 0x8) === 0x8);

        req.session.user = { ...userRes.data, guilds: filteredGuilds };
        res.redirect('/dashboard');
    } catch (e) { res.redirect('/'); }
});

// DİĞER ROUTERLAR (DEĞİŞMEDİ)
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="hero"><div class="hero-overlay"><h1>Hoş geldin, ${req.session.user.username}</h1><p>Sunucu seçerek maçlara göz atabilirsin.</p></div></div>
    `, req.session.user, 'home'));
});

app.get('/apply', (req, res) => { /* Aynı kalacak */ });
app.get('/my-cards', (req, res) => { /* Aynı kalacak */ });
app.post('/apply-card', (req, res) => { /* Aynı kalacak */ });
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

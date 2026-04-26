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

// --- ASSETS ---
const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    BOT_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497738166235430972/Gemini_Generated_Image_o1s4jao1s4jao1s4.png",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png",
    ROBLOX_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935107258843247/image.png"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png"
};

const CLIENT_ID = "1497727912978153482";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "https://ropasso.vercel.app/api/auth/callback";
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`;

// --- DATABASE SIMULATION ---
let db_cards = {};
let db_matches = [
    { id: "m1", guildId: "123", home: "Ankaragücü", away: "Beşiktaş", stadium: "Eryaman Stadyumu", time: "20:00", date: "28.04.2026", status: "BİLET VAR" },
    { id: "m2", guildId: "456", home: "Fenerbahçe", away: "Ankaragücü", stadium: "Şükrü Saracoğlu", time: "19:00", date: "02.05.2026", status: "YAKINDA" }
];

// --- UI TEMPLATE ---
const ui = (body, user = null, activePage = 'home') => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Global Portal</title>
    <style>
        :root { --primary: #e30613; --secondary: #1d1d1f; --bg: #f2f2f7; --glass: rgba(255, 255, 255, 0.9); }
        * { box-sizing: border-box; font-family: 'SF Pro Display', sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--secondary); }
        
        .navbar { background: var(--glass); backdrop-filter: blur(20px); height: 75px; display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 9999; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .nav-links { display: flex; gap: 25px; align-items: center; }
        .nav-link { text-decoration: none; color: #666; font-weight: 600; font-size: 14px; padding: 10px 0; }
        .nav-link:hover, .nav-link.active { color: var(--primary); }

        /* FIXED DROPDOWN */
        .dropdown { position: relative; display: inline-block; }
        .dropdown-trigger { cursor: pointer; display: flex; align-items: center; gap: 5px; }
        .dropdown-content { 
            display: none; position: absolute; top: 100%; left: 0; 
            background: white; min-width: 260px; border-radius: 18px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.15); z-index: 10000; 
            border: 1px solid #eee; padding: 10px 0;
        }
        .dropdown:hover .dropdown-content { display: block; }
        .dropdown-item { 
            padding: 12px 20px; text-decoration: none; color: #333; 
            display: flex; justify-content: space-between; align-items: center; font-size: 14px; 
        }
        .dropdown-item:hover { background: #f8f8f8; color: var(--primary); }
        .status-dot { width: 8px; height: 8px; background: #44b700; border-radius: 50%; }

        .container { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: #fff; border-radius: 24px; padding: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); margin-bottom: 25px; }
        .nav-btn { background: var(--primary); color: #fff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px; border:none; cursor:pointer; }
        
        .match-card { display: flex; align-items: center; justify-content: space-between; padding: 20px; background: #fff; border-radius: 18px; border: 1px solid #f0f0f0; margin-bottom: 15px; transition: 0.2s; }
        .match-card:hover { transform: scale(1.01); border-color: var(--primary); }
    </style>
</head>
<body>
    <div class="navbar">
        <img src="${ASSETS.PASSO_NAV}" height="30" onclick="location.href='/'" style="cursor:pointer">
        <div class="nav-links">
            <a href="/dashboard" class="nav-link ${activePage==='home'?'active':''}">Ana Sayfa</a>
            
            <div class="dropdown">
                <div class="nav-link dropdown-trigger ${activePage==='servers'?'active':''}">Sunucularım ▼</div>
                <div class="dropdown-content">
                    ${user && user.guilds && user.guilds.length > 0 ? 
                        user.guilds.map(g => `
                            <a href="/server/${g.id}" class="dropdown-item">
                                <span><b>#</b> ${g.name}</span>
                                <div class="status-dot"></div>
                            </a>
                        `).join('') : 
                        '<div class="dropdown-item">Botun olduğu sunucu yok.</div>'}
                </div>
            </div>

            <a href="/matches" class="nav-link ${activePage==='matches'?'active':''}">Global Maçlar</a>
            <a href="/my-cards" class="nav-link ${activePage==='cards'?'active':''}">Kartlarım</a>
            ${user ? `<a href="/logout" class="nav-btn" style="background:#333;">Çıkış</a>` : `<a href="/login" class="nav-btn">Giriş Yap</a>`}
        </div>
    </div>
    <div class="container">${body}</div>
</body>
</html>`;

// --- ROUTES ---

// Global Maçlar Listesi (Bütün sunucuların aktif maçları)
app.get('/matches', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    // Sadece henüz tarihi geçmemiş veya aktif maçları filtrele
    const activeMatches = db_matches.filter(m => m.status !== "BİTTİ");

    let html = `<h2>🏆 Global Maç Listesi</h2><p>RoPasso kullanan tüm sunuculardaki aktif etkinlikler.</p>`;
    html += activeMatches.map(m => `
        <div class="match-card">
            <div style="flex:1"><strong>${m.home} vs ${m.away}</strong><br><small style="color:#888;">${m.stadium}</small></div>
            <div style="flex:1; text-align:center;"><b>${m.date}</b><br>${m.time}</div>
            <div style="flex:1; text-align:right;">
                <a href="/buy/${m.id}" class="nav-btn">${m.status}</a>
            </div>
        </div>
    `).join('');

    res.send(ui(html, req.session.user, 'matches'));
});

// Sunucu Detay Sayfası (Tıklayınca açılan yer)
app.get('/server/:guildId', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const guild = req.session.user.guilds.find(g => g.id === req.params.guildId);
    if (!guild) return res.send("Bu sunucuda yetkin yok kanka.");

    const serverMatches = db_matches.filter(m => m.guildId === req.params.guildId);

    res.send(ui(`
        <div class="glass-card">
            <h1># ${guild.name} Etkinlikleri</h1>
            <p>Bu sunucuya özel tanımlanmış biletler aşağıdadır.</p>
            <div style="margin-top:30px;">
                ${serverMatches.length > 0 ? serverMatches.map(m => `
                    <div class="match-card" style="border-left: 5px solid var(--primary);">
                        <div><b>${m.home} - ${m.away}</b></div>
                        <a href="/buy/${m.id}" class="nav-btn">BİLET AL</a>
                    </div>
                `).join('') : '<p style="color:#999;">Bu sunucuda şu an aktif maç yok.</p>'}
            </div>
        </div>
    `, req.session.user, 'servers'));
});

// AUTH CALLBACK (Botun olduğu sunucuları filtreleme)
app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        
        const userRes = await axios.get('https://discord.com/api/users/@me', { 
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } 
        });

        // Üyenin tüm sunucularını çek
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { 
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } 
        });

        // FİLTRE: Hem kullanıcının olduğu hem de RoPasso botunun kurulu olduğu sunucular 
        // (Burada db_matches içinde guildId'si olan sunucuları botun olduğu sunucular kabul ediyoruz)
        const botGuildIds = db_matches.map(m => m.guildId);
        const activeGuilds = guildsRes.data.filter(g => botGuildIds.includes(g.id) || (g.permissions & 0x8) === 0x8);

        req.session.user = { ...userRes.data, guilds: activeGuilds };
        res.redirect('/dashboard');
    } catch (e) { 
        console.error(e);
        res.redirect('/'); 
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="glass-card">
            <h2>Hoş geldin, ${req.session.user.username}!</h2>
            <p>Aşağıdaki "Sunucularım" menüsünden bilet almak istediğin topluluğu seçebilirsin.</p>
        </div>
    `, req.session.user, 'home'));
});

app.get('/login', (req, res) => res.redirect(DISCORD_AUTH_URL));
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

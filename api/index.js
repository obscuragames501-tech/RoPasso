const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

// --- CONFIG & ENV ---
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1497727912978153482";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN; 
const REDIRECT_URI = "https://ropasso.vercel.app/api/auth/callback";

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ropasso-ultra-v2-2026-special-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- ASSETS & THEME ---
const THEME = {
    bg: "#121212",
    cardBg: "#1F1F1F", // Senin meşhur 31,31,31 rengin
    primary: "#FFB300", // Amber/Gold
    text: "#FFFFFF",
    muted: "#A0A0A0",
    red: "#e30613"
};

const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    STADIUM: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png",
    ERROR_ICON: "https://www.freeiconspng.com/thumbs/error-icon/error-icon-4.png"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png"
};

// Geçici Veritabanı (Vercel'de her restartta sıfırlanır, ileride MongoDB bağlarız)
let db_cards = {};
let db_matches = [
    { id: '1', guildId: 'all', home: 'Ankaragücü', away: 'Beşiktaş', time: '20:00', stadium: 'Eryaman Stadyumu', price: '150 TL' },
    { id: '2', guildId: 'all', home: 'Ankaragücü', away: 'Galatasaray', time: '19:00', stadium: 'Eryaman Stadyumu', price: '200 TL' }
];

// --- MASTER UI TEMPLATE ---
const ui = (body, user = null, activePage = 'home') => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Yönetim Paneli</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
        
        :root { 
            --primary: ${THEME.primary}; 
            --bg: ${THEME.bg}; 
            --card: ${THEME.cardBg}; 
            --text: ${THEME.text};
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        
        body { 
            background-color: var(--bg); 
            color: var(--text); 
            overflow-x: hidden;
            display: flex;
            min-height: 100vh;
        }

        /* SIDEBAR */
        .sidebar {
            width: 280px;
            background: var(--card);
            border-right: 1px solid rgba(255,255,255,0.05);
            display: flex;
            flex-direction: column;
            padding: 30px 20px;
            position: fixed;
            height: 100vh;
        }

        .logo-area { margin-bottom: 50px; text-align: center; }
        .logo-area img { width: 150px; filter: drop-shadow(0 0 10px var(--primary)); }

        .nav-menu { flex-grow: 1; }
        .nav-item {
            display: flex;
            align-items: center;
            padding: 15px 20px;
            color: #888;
            text-decoration: none;
            border-radius: 12px;
            margin-bottom: 8px;
            font-weight: 600;
            transition: 0.3s;
        }
        .nav-item:hover, .nav-item.active {
            background: rgba(255, 179, 0, 0.1);
            color: var(--primary);
        }

        .user-bar {
            background: rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .user-avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--primary); }

        /* MAIN CONTENT */
        .main-content {
            margin-left: 280px;
            flex-grow: 1;
            padding: 40px 60px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
        }

        .glass-card {
            background: var(--card);
            border-radius: 24px;
            padding: 30px;
            border: 1px solid rgba(255,255,255,0.03);
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        /* MATCH CARDS */
        .match-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
        }
        .match-card {
            background: linear-gradient(145deg, #252525, #1a1a1a);
            border-radius: 20px;
            padding: 25px;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .match-card::before {
            content: "PASSO";
            position: absolute;
            right: -20px;
            top: 10px;
            font-size: 60px;
            font-weight: 900;
            opacity: 0.03;
            transform: rotate(-20deg);
        }
        .team-box { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .team-name { font-size: 18px; font-weight: 800; color: var(--primary); }
        .vs { font-size: 12px; color: #555; background: #fff; padding: 4px 8px; border-radius: 5px; font-weight: 900; }

        .btn-buy {
            width: 100%;
            padding: 12px;
            background: var(--primary);
            color: #000;
            border: none;
            border-radius: 10px;
            font-weight: 800;
            cursor: pointer;
            margin-top: 15px;
            text-transform: uppercase;
        }

        /* FORM ELEMENTS */
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; margin-bottom: 8px; color: #888; font-size: 14px; }
        .input-box {
            width: 100%;
            padding: 15px;
            background: #121212;
            border: 1px solid #333;
            border-radius: 10px;
            color: white;
            font-size: 16px;
        }
        .input-box:focus { border-color: var(--primary); outline: none; }

        /* DROPDOWN */
        .dropdown { position: relative; }
        .dropdown-content {
            display: none;
            position: absolute;
            background: #1f1f1f;
            min-width: 250px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 100;
            margin-top: 10px;
            border: 1px solid #333;
        }
        .dropdown:hover .dropdown-content { display: block; }
        .dropdown-item {
            padding: 12px 20px;
            color: #fff;
            text-decoration: none;
            display: block;
            font-size: 14px;
        }
        .dropdown-item:hover { background: var(--primary); color: #000; }

        .status-badge {
            background: rgba(0, 255, 0, 0.1);
            color: #00ff00;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="logo-area">
            <img src="${ASSETS.LOGO}" alt="RoPasso Logo">
        </div>
        
        <nav class="nav-menu">
            <a href="/dashboard" class="nav-item ${activePage==='home'?'active':''}">🏠 Panel Özeti</a>
            <a href="/matches" class="nav-item ${activePage==='matches'?'active':''}">🎫 Aktif Maçlar</a>
            <a href="/apply" class="nav-item ${activePage==='apply'?'active':''}">💳 Kart Başvurusu</a>
            <a href="/my-cards" class="nav-item ${activePage==='cards'?'active':''}">📂 Kartlarım</a>
            <div class="dropdown">
                <a href="#" class="nav-item">🌐 Sunucularım ▼</a>
                <div class="dropdown-content">
                    ${user && user.commonGuilds && user.commonGuilds.length > 0 
                        ? user.commonGuilds.map(g => `<a href="/server/${g.id}" class="dropdown-item">🟢 ${g.name}</a>`).join('') 
                        : '<div class="dropdown-item">Botun Olduğu Sunucu Yok</div>'}
                </div>
            </div>
            <a href="/add-bot" class="nav-item" style="color: #5865F2;">🤖 Botu Ekle</a>
        </nav>

        ${user ? `
        <div class="user-bar">
            <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" class="user-avatar">
            <div style="overflow:hidden">
                <div style="font-size:14px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${user.username}</div>
                <a href="/logout" style="color:var(--primary); font-size:12px; text-decoration:none;">Güvenli Çıkış</a>
            </div>
        </div>
        ` : `
        <a href="/login" class="btn-buy" style="text-align:center; text-decoration:none; display:block;">Giriş Yap</a>
        `}
    </div>

    <div class="main-content">
        <div class="header">
            <h1>RoPasso <span style="color:var(--primary)">V2.0</span></h1>
            <div class="status-badge">Sistem Aktif</div>
        </div>
        ${body}
    </div>
</body>
</html>`;

// --- ROUTER & LOGIC ---

app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.send(`
        <body style="background:#121212; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; color:white; margin:0;">
            <div style="text-align:center;">
                <img src="${ASSETS.LOGO}" width="250" style="margin-bottom:30px;">
                <h1 style="font-size:48px; font-weight:900;">RO<span style="color:#FFB300">PASSO</span></h1>
                <p style="color:#888; font-size:18px; margin-bottom:40px;">Roblox Stadyumlarının Resmi Dijital Bilet Platformu</p>
                <a href="/login" style="background:#FFB300; color:black; padding:15px 40px; border-radius:10px; font-weight:900; text-decoration:none; font-size:20px;">DISCORD İLE BAŞLA</a>
            </div>
        </body>
    `);
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="glass-card" style="margin-bottom:30px;">
            <h2 style="margin-bottom:10px;">Hoş geldin, ${req.session.user.username}! 👋</h2>
            <p style="color:#888;">Panel üzerinden biletlerini yönetebilir, taraftar kartını oluşturabilirsin.</p>
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
            <div class="glass-card">
                <h3>Duyurular</h3>
                <div style="margin-top:20px; padding:15px; background:rgba(255,179,0,0.05); border-left:4px solid var(--primary); border-radius:8px;">
                    <strong>Yeni Güncelleme!</strong> artık botun bulunduğu sunucuları otomatik filtreliyoruz.
                </div>
            </div>
            <div class="glass-card">
                <h3>İstatistiklerin</h3>
                <div style="display:flex; justify-content:space-around; margin-top:30px; text-align:center;">
                    <div><div style="font-size:32px; font-weight:900; color:var(--primary);">0</div><div style="font-size:12px; color:#888;">BİLET</div></div>
                    <div><div style="font-size:32px; font-weight:900; color:var(--primary);">${db_cards[req.session.user.id] ? '1' : '0'}</div><div style="font-size:12px; color:#888;">KART</div></div>
                    <div><div style="font-size:32px; font-weight:900; color:var(--primary);">${req.session.user.commonGuilds.length}</div><div style="font-size:12px; color:#888;">SUNUCU</div></div>
                </div>
            </div>
        </div>
    `, req.session.user, 'home'));
});

app.get('/matches', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const matchHtml = db_matches.map(m => `
        <div class="match-card">
            <div class="team-box">
                <span class="team-name">${m.home}</span>
                <span class="vs">VS</span>
                <span class="team-name">${m.away}</span>
            </div>
            <div style="font-size:14px; color:#888; margin-bottom:5px;">📅 Bugün - ${m.time}</div>
            <div style="font-size:14px; color:#888;">🏟️ ${m.stadium}</div>
            <div style="margin-top:20px; font-size:24px; font-weight:900; color:var(--primary);">${m.price}</div>
            <button class="btn-buy" onclick="alert('Bilet alımı yakında aktif olacak kanka!')">BİLET AL</button>
        </div>
    `).join('');

    res.send(ui(`
        <h2 style="margin-bottom:30px;">Aktif Etkinlikler ve Maçlar</h2>
        <div class="match-grid">${matchHtml}</div>
    `, req.session.user, 'matches'));
});

app.get('/apply', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="glass-card" style="max-width:700px;">
            <h2>Kart Başvuru Formu</h2>
            <p style="color:#888; margin-bottom:30px;">Lütfen bilgilerini Roblox profilinle aynı olacak şekilde gir kanka.</p>
            <form action="/apply-card" method="POST">
                <div class="input-group">
                    <label>Roblox Kullanıcı Adı</label>
                    <input type="text" name="roblox_name" class="input-box" placeholder="Örn: YigitDemirbas" required>
                </div>
                <div class="input-group">
                    <label>Roblox Kullanıcı ID (Sayısal)</label>
                    <input type="number" name="roblox_id" class="input-box" placeholder="Örn: 12345678" required>
                </div>
                <div class="input-group">
                    <label>Kart Tasarımı Seçin</label>
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; margin-top:10px;">
                        <label style="cursor:pointer; text-align:center;">
                            <input type="radio" name="style" value="RED" checked style="margin-bottom:10px;"><br>
                            <img src="${CARDS.RED}" width="100%" style="border-radius:10px;">
                        </label>
                        <label style="cursor:pointer; text-align:center;">
                            <input type="radio" name="style" value="BLACK" style="margin-bottom:10px;"><br>
                            <img src="${CARDS.BLACK}" width="100%" style="border-radius:10px;">
                        </label>
                        <label style="cursor:pointer; text-align:center;">
                            <input type="radio" name="style" value="PATTERN" style="margin-bottom:10px;"><br>
                            <img src="${CARDS.PATTERN}" width="100%" style="border-radius:10px;">
                        </label>
                    </div>
                </div>
                <button type="submit" class="btn-buy" style="padding:20px; font-size:18px;">BAŞVURUYU GÖNDER</button>
            </form>
        </div>
    `, req.session.user, 'apply'));
});

app.get('/my-cards', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const card = db_cards[req.session.user.id];
    if (!card) return res.redirect('/apply');

    res.send(ui(`
        <div class="glass-card" style="text-align:center;">
            <h1>Dijital Passo Kartın</h1>
            <div style="position:relative; width:500px; margin:40px auto; border-radius:25px; overflow:hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.6); border: 1px solid rgba(255,179,0,0.3);">
                <img src="${CARDS[card.style]}" style="width:100%; display:block;">
                <div style="position:absolute; bottom:40px; left:40px; display:flex; align-items:center; gap:20px; color:white;">
                    <img src="https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png" style="width:90px; height:90px; border-radius:50%; border:3px solid #fff;">
                    <div style="text-align:left;">
                        <div style="font-size:28px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">${card.name}</div>
                        <div style="font-size:12px; opacity:0.8; font-weight:600;">ID: ${card.id} | RO-PASSO MEMBER</div>
                    </div>
                </div>
            </div>
            <p style="color:#888;">Bu kart dijitaldir ve Roblox sunucularında sistem tarafından okunur.</p>
        </div>
    `, req.session.user, 'cards'));
});

// --- API & AUTH ---

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.redirect('/');
    
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        
        const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        const userGuilds = await axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        
        // BOTUN OLDUĞU SUNUCULARI ALMA
        const botGuildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bot ${BOT_TOKEN}` } });
        const botGuildIds = botGuildsRes.data.map(g => g.id);

        const commonGuilds = userGuilds.data.filter(g => (g.permissions & 0x8) === 0x8 && botGuildIds.includes(g.id));

        req.session.user = { ...userRes.data, commonGuilds }; 
        res.redirect('/dashboard');
    } catch (e) { 
        console.error("Kritik Auth Hatası:", e.message);
        res.redirect('/'); 
    }
});

app.post('/apply-card', (req, res) => {
    if (req.session.user) {
        db_cards[req.session.user.id] = {
            name: req.body.roblox_name,
            id: req.body.roblox_id,
            style: req.body.style
        };
    }
    res.redirect('/my-cards');
});

app.get('/login', (req, res) => res.redirect(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`));
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

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

// --- CONFIG & ASSETS ---
const BOT_ID = "1497727912978153482";
const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png",
    ROBLOX_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935107258843247/image.png"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png"
};

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || BOT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "https://ropasso.vercel.app/api/auth/callback";
const AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds+guilds.members.read`;

// --- DATABASE SIMULATION ---
// db_cards[userId][guildId] şeklinde tutulacak
let db_cards = {}; 
let db_matches = [
    { id: "m1", guildId: "123456789", home: "Ankaragücü", away: "Beşiktaş", stadium: "Eryaman Stadyumu", date: "28.04.2026" },
    { id: "m2", guildId: "1495543284423065662", home: "Ankaragücü", away: "Galatasaray", stadium: "Eryaman Stadyumu", date: "02.05.2026" }
];

// --- ARAYÜZ ---
const ui = (body, user = null, activePage = 'home') => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Yönetim Paneli</title>
    <style>
        :root { --primary: #e30613; --secondary: #1d1d1f; --bg: #f2f2f7; --glass: rgba(255, 255, 255, 0.9); }
        * { box-sizing: border-box; font-family: 'SF Pro Display', sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--secondary); }
        
        .navbar { background: var(--glass); backdrop-filter: blur(15px); height: 75px; display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 1000; border-bottom: 1px solid rgba(0,0,0,0.1); }
        .nav-links { display: flex; gap: 25px; align-items: center; }
        .nav-link { text-decoration: none; color: #555; font-weight: 600; font-size: 14px; transition: 0.2s; }
        .nav-link:hover, .nav-link.active { color: var(--primary); }
        
        .btn-red { background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; border: none; cursor: pointer; transition: 0.3s; }
        .btn-red:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(227,6,19,0.3); }

        .dropdown { position: relative; display: inline-block; }
        .dropdown-content { 
            display: none; position: absolute; background: white; min-width: 280px; 
            max-height: 350px; overflow-y: auto; border-radius: 12px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 10; margin-top: 10px; border: 1px solid #eee;
        }
        .dropdown:hover .dropdown-content { display: block; animation: slideUp 0.3s ease; }
        .dropdown-item { padding: 15px; text-decoration: none; color: #333; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #f9f9f9; }
        .dropdown-item:hover { background: #fff5f5; color: var(--primary); }

        .container { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: #fff; border-radius: 24px; padding: 35px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); margin-bottom: 30px; }
        
        .hero { height: 350px; border-radius: 30px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${ASSETS.NEWS_BANNER}') center/cover; display: flex; align-items: flex-end; padding: 40px; color: white; margin-bottom: 30px; }
        
        .final-card { width: 450px; height: 284px; border-radius: 20px; position: relative; margin: 20px auto; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .card-user-info { position: absolute; bottom: 25px; left: 25px; display: flex; align-items: center; gap: 15px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .card-avatar { width: 75px; height: 75px; border-radius: 50%; border: 3px solid #fff; }

        .input-box { width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #eee; margin-top: 10px; font-size: 16px; }
        .input-box:focus { border-color: var(--primary); outline: none; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="navbar">
        <div style="display:flex; align-items:center; gap:20px;">
            <img src="${ASSETS.PASSO_NAV}" height="35" onclick="location.href='/dashboard'" style="cursor:pointer">
            <a href="/add-bot" class="btn-red" style="background:#5865F2; font-size:12px;">BOTU EKLE</a>
        </div>
        <div class="nav-links">
            <a href="/dashboard" class="nav-link ${activePage==='home'?'active':''}">ANA SAYFA</a>
            <div class="dropdown">
                <span class="nav-link ${activePage==='servers'?'active':''}">SUNUCU SEÇ ▼</span>
                <div class="dropdown-content">
                    ${user && user.passoGuilds ? user.passoGuilds.map(g => `<a href="/server/${g.id}" class="dropdown-item"><b>#</b> ${g.name}</a>`).join('') : '<div class="dropdown-item">Sunucu Yok</div>'}
                </div>
            </div>
            <a href="/my-cards" class="nav-link ${activePage==='cards'?'active':''}">KARTLARIM</a>
            ${user ? `<a href="/logout" class="btn-red" style="background:#333;">ÇIKIŞ</a>` : `<a href="/login" class="btn-red">GİRİŞ YAP</a>`}
        </div>
    </div>
    <div class="container">${body}</div>
</body>
</html>`;

// --- ROUTES ---

app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.send(ui(`
        <div style="text-align:center; padding: 80px 0;">
            <img src="${ASSETS.LOGO}" width="280">
            <h1 style="font-size:50px; font-weight:900; margin: 20px 0;">Yeni Nesil Passo Deneyimi</h1>
            <p style="color:#666; font-size:18px; margin-bottom:40px;">Roblox dünyasında stadyum biletin ve taraftar kartın her an yanında.</p>
            <a href="/login" class="btn-red" style="padding: 20px 60px; font-size:18px; background:#5865F2;">Discord ile Bağlan</a>
        </div>
    `));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="hero">
            <div>
                <h1 style="margin:0; font-size:40px;">Hoş geldin, ${req.session.user.username}!</h1>
                <p style="font-size:18px; opacity:0.9;">RoPasso botunun bulunduğu ${req.session.user.passoGuilds.length} sunucu tespit edildi.</p>
            </div>
        </div>
        <div class="glass-card">
            <h3>Aktif Sunucuların</h3>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">
                ${req.session.user.passoGuilds.map(g => `
                    <a href="/server/${g.id}" style="text-decoration:none; color:inherit;">
                        <div style="padding:20px; border:2px solid #eee; border-radius:15px; text-align:center; transition:0.3s;" onmouseover="this.style.borderColor='#e30613'" onmouseout="this.style.borderColor='#eee'">
                            <div style="font-weight:700;">${g.name}</div>
                            <small style="color:var(--primary)">Yönetime Git →</small>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>
    `, req.session.user, 'home'));
});

// SUNUCUYA ÖZEL KART BAŞVURUSU
app.get('/server/:guildId', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const guild = req.session.user.passoGuilds.find(g => g.id === req.params.guildId);
    if (!guild) return res.redirect('/dashboard');

    res.send(ui(`
        <div class="glass-card">
            <h2># ${guild.name} için Passo Kartı</h2>
            <p>Bu sunucuya özel passolig kartınızı buradan tanımlayın.</p>
            <form action="/apply-card/${guild.id}" method="POST">
                <label>Roblox Kullanıcı Adı</label>
                <input type="text" name="roblox_name" class="input-box" placeholder="Oyundaki isminiz..." required>
                <label style="margin-top:20px; display:block;">Tasarım Seçin</label>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px; margin-top:10px;">
                    <label><input type="radio" name="style" value="RED" checked> <img src="${CARDS.RED}" width="100%" style="border-radius:10px;"></label>
                    <label><input type="radio" name="style" value="BLACK"> <img src="${CARDS.BLACK}" width="100%" style="border-radius:10px;"></label>
                    <label><input type="radio" name="style" value="PATTERN"> <img src="${CARDS.PATTERN}" width="100%" style="border-radius:10px;"></label>
                </div>
                <button type="submit" class="btn-red" style="width:100%; margin-top:30px; padding:18px;">KARTI TANIMLA</button>
            </form>
        </div>
    `, req.session.user, 'servers'));
});

app.post('/apply-card/:guildId', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const uid = req.session.user.id;
    const gid = req.params.guildId;
    if (!db_cards[uid]) db_cards[uid] = {};
    
    db_cards[uid][gid] = {
        name: req.body.roblox_name,
        style: req.body.style,
        guildName: req.session.user.passoGuilds.find(g => g.id === gid).name
    };
    res.redirect('/my-cards');
});

// TÜM KARTLARIN LİSTELENDİĞİ YER
app.get('/my-cards', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const userCards = db_cards[req.session.user.id] || {};
    const cardKeys = Object.keys(userCards);

    let cardsHtml = cardKeys.length > 0 ? cardKeys.map(gid => {
        const c = userCards[gid];
        const avatar = `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png`;
        return `
            <div class="glass-card" style="text-align:center;">
                <h4>${c.guildName} Passolig Kartı</h4>
                <div class="final-card">
                    <img src="${CARDS[c.style]}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="card-user-info">
                        <img src="${avatar}" class="card-avatar">
                        <div style="text-align:left;">
                            <div style="font-weight:900; font-size:22px; text-transform:uppercase;">${c.name}</div>
                            <div style="font-size:11px; opacity:0.8;">${c.guildName.toUpperCase()} ÖZEL</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('') : '<p>Henüz bir sunucu için kart tanımlamadınız.</p>';

    res.send(ui(`<h2>Cüzdanım</h2>${cardsHtml}`, req.session.user, 'cards'));
});

// --- AUTH LOGIC ---
app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        
        const userRes = await axios.get('https://discord.com/api/users/@me', { 
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } 
        });
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { 
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } 
        });
        
        // ÖNEMLİ: Sadece RoPasso Botunun olduğu sunucuları filtreler
        // Gerçekte botun guild listesini bir DB'den veya Discord API bot token ile çekmelisin.
        // Burada senin istediğin "Botu bulması lazım" mantığı için mock bir kontrol yapıyoruz.
        const passoGuilds = guildsRes.data.filter(g => (g.permissions & 0x8) === 0x8 || g.id === "1495543284423065662");

        req.session.user = { ...userRes.data, passoGuilds };
        res.redirect('/dashboard');
    } catch (e) { res.redirect('/'); }
});

app.get('/login', (req, res) => res.redirect(AUTH_URL));
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

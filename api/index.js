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
    ROBLOX_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935107258843247/image.png",
    BOT_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497738166235430972/Gemini_Generated_Image_o1s4jao1s4jao1s4.png",
    DISCORD_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935416429383801/image.png"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png"
};

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || BOT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET; // Vercel Env'den çek
const REDIRECT_URI = "https://ropasso.vercel.app/api/auth/callback";
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds+guilds.members.read`;
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${BOT_ID}&permissions=8&scope=bot+applications.commands`;

// --- DATABASE SIMULATION ---
let db_cards = {}; // db_cards[userId][guildId] = {data}
let db_announcements = [
    { id: 1, title: "Sistem Güncellemesi", content: "Passo V2 altyapısına geçiş yapıldı. Tüm kartlar artık Roblox üzerinden otomatik doğrulanıyor.", date: "26.04.2026" },
    { id: 2, title: "Eryaman Stadyumu Hakkında", content: "Ankaragücü maçları için bilet satışları 2 saat önce açılacaktır.", date: "25.04.2026" }
];

// --- ARAYÜZ ŞABLONU ---
const ui = (body, user = null, activePage = 'home') => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Yönetim Paneli</title>
    <style>
        :root { --primary: #e30613; --secondary: #1d1d1f; --bg: #f2f2f7; --glass: rgba(255, 255, 255, 0.9); }
        * { box-sizing: border-box; font-family: 'SF Pro Display', -apple-system, sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--secondary); overflow-x: hidden; }
        
        .navbar { background: var(--glass); backdrop-filter: blur(20px); height: 75px; display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 1000; border-bottom: 1px solid rgba(0,0,0,0.08); }
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-link { text-decoration: none; color: #666; font-weight: 600; font-size: 14px; transition: 0.2s; cursor: pointer; }
        .nav-link:hover, .nav-link.active { color: var(--primary); }
        
        .nav-btn { background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; border: none; cursor: pointer; display: inline-block; transition: 0.3s; }
        .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(227,6,19,0.3); }

        .dropdown { position: relative; display: inline-block; }
        .dropdown-content { 
            display: none; position: absolute; background: white; min-width: 280px; 
            max-height: 400px; overflow-y: auto; border-radius: 15px; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.1); z-index: 10; margin-top: 10px; border: 1px solid #eee;
        }
        .dropdown:hover .dropdown-content { display: block; animation: slideUp 0.3s ease; }
        .dropdown-item { padding: 15px 20px; text-decoration: none; color: #333; display: flex; align-items: center; gap: 10px; font-weight: 600; border-bottom: 1px solid #f9f9f9; }
        .dropdown-item:hover { background: #fff5f5; color: var(--primary); }

        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: #fff; border-radius: 28px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); margin-bottom: 30px; }
        
        .hero { position: relative; height: 400px; border-radius: 35px; overflow: hidden; margin-bottom: 40px; background: url('${ASSETS.NEWS_BANNER}') center/cover; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; color: white; }

        .final-card { position: relative; width: 450px; height: 284px; border-radius: 22px; overflow: hidden; margin: 30px auto; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
        .final-card-user { position: absolute; bottom: 30px; left: 30px; display: flex; align-items: center; gap: 18px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .final-card-avatar { width: 85px; height: 85px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; }

        .input-box { width: 100%; padding: 16px; border-radius: 14px; border: 2px solid #eee; margin-top: 8px; font-size: 16px; transition: 0.3s; }
        .input-box:focus { border-color: var(--primary); outline: none; }

        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="navbar">
        <div style="display:flex; align-items:center; gap:20px;">
            <img src="${ASSETS.PASSO_NAV}" height="32" onclick="location.href='/dashboard'" style="cursor:pointer">
            <a href="${BOT_INVITE_URL}" target="_blank" class="nav-btn" style="background:#5865F2; font-size:12px;">BOTU SUNUCUNA EKLE</a>
        </div>
        <div class="nav-links">
            <a href="/dashboard" class="nav-link ${activePage==='home'?'active':''}">Ana Sayfa</a>
            <div class="dropdown">
                <span class="nav-link ${activePage==='servers'?'active':''}">Sunucu Seç ▼</span>
                <div class="dropdown-content">
                    ${user && user.passoGuilds && user.passoGuilds.length > 0 ? user.passoGuilds.map(g => `<a href="/server/${g.id}" class="dropdown-item"><b>#</b> ${g.name}</a>`).join('') : '<div class="dropdown-item">Botlu Sunucu Yok</div>'}
                </div>
            </div>
            <a href="/my-cards" class="nav-link ${activePage==='cards'?'active':''}">Kartlarım</a>
            ${user ? `<a href="/logout" class="nav-btn" style="background:#333;">Çıkış Yap</a>` : `<a href="/login" class="nav-btn">Giriş Yap</a>`}
        </div>
    </div>
    <div class="container">
        ${body}
    </div>
</body>
</html>`;

// --- ROUTES ---

app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.send(ui(`
        <div style="text-align:center; padding: 100px 0;">
            <img src="${ASSETS.LOGO}" width="300" style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));">
            <h1 style="font-size:55px; font-weight:900; letter-spacing:-2px; margin: 20px 0;">Yeni Nesil Passo</h1>
            <p style="color:#666; font-size:20px; max-width:600px; margin: 0 auto 40px auto;">Roblox stadyumlarına tek tıkla bilet al, sunucuya özel kartını oluştur.</p>
            <a href="/login" class="nav-btn" style="padding: 20px 50px; font-size:18px; background:#5865F2;">Discord ile Giriş Yap</a>
        </div>
    `));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    
    let announcementsHtml = db_announcements.map(a => `
        <div style="margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #eee;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="margin:0; color:var(--primary);">${a.title}</h4>
                <small style="color:#aaa;">${a.date}</small>
            </div>
            <p style="margin:5px 0 0 0; font-size:14px; color:#555;">${a.content}</p>
        </div>
    `).join('');

    res.send(ui(`
        <div class="hero">
            <div class="hero-overlay">
                <h1 style="font-size:50px; margin:0;">Eryaman'da Maç Heyecanı!</h1>
                <p style="font-size:20px; opacity:0.8;">Hemen bir sunucu seç ve o sunucuya özel kartını oluştur.</p>
            </div>
        </div>
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:30px;">
            <div class="glass-card">
                <h2>Hoş geldin, ${req.session.user.username}!</h2>
                <p>Aşağıda RoPasso botunun bulunduğu sunucuların listelenmiştir. İşlem yapmak istediğin sunucuyu seç:</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-top:20px;">
                    ${req.session.user.passoGuilds.map(g => `
                        <a href="/server/${g.id}" style="text-decoration:none;">
                            <div style="padding:20px; border:2px solid #eee; border-radius:15px; text-align:center; transition:0.3s; color:#333;" onmouseover="this.style.borderColor='#e30613'" onmouseout="this.style.borderColor='#eee'">
                                <strong>${g.name}</strong><br><small style="color:var(--primary)">Yönetime Git</small>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
            <div class="glass-card">
                <h3>Duyurular</h3>
                ${announcementsHtml}
            </div>
        </div>
    `, req.session.user, 'home'));
});

// SUNUCUYA ÖZEL BAŞVURU SAYFASI
app.get('/server/:guildId', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const guild = req.session.user.passoGuilds.find(g => g.id === req.params.guildId);
    if (!guild) return res.redirect('/dashboard');

    res.send(ui(`
        <div class="glass-card" style="max-width:800px; margin:auto;">
            <h2 style="text-align:center;">${guild.name} Passo Başvurusu</h2>
            <form action="/apply-card/${guild.id}" method="POST">
                <label>Roblox Kullanıcı Adı</label>
                <input type="text" name="roblox_name" class="input-box" placeholder="Kullanıcı adınızı girin..." required>
                <label style="margin-top:20px; display:block;">Roblox ID</label>
                <input type="text" name="roblox_id" class="input-box" placeholder="ID numaranızı girin..." required>
                <img src="${ASSETS.ROBLOX_HELP}" style="width:100%; border-radius:15px; margin-top:15px;">
                
                <h3 style="margin-top:40px;">Kart Tasarımı</h3>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px;">
                    <label style="cursor:pointer; text-align:center;">
                        <input type="radio" name="style" value="RED" checked>
                        <img src="${CARDS.RED}" width="100%" style="border-radius:10px; margin-top:10px;">
                    </label>
                    <label style="cursor:pointer; text-align:center;">
                        <input type="radio" name="style" value="BLACK">
                        <img src="${CARDS.BLACK}" width="100%" style="border-radius:10px; margin-top:10px;">
                    </label>
                    <label style="cursor:pointer; text-align:center;">
                        <input type="radio" name="style" value="PATTERN">
                        <img src="${CARDS.PATTERN}" width="100%" style="border-radius:10px; margin-top:10px;">
                    </label>
                </div>
                <button type="submit" class="nav-btn" style="width:100%; margin-top:40px; padding:20px;">BAŞVURUYU TAMAMLA</button>
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
        id: req.body.roblox_id,
        style: req.body.style,
        guildName: req.session.user.passoGuilds.find(g => g.id === gid).name
    };
    res.redirect('/my-cards');
});

app.get('/my-cards', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const userCards = db_cards[req.session.user.id] || {};
    const cardList = Object.keys(userCards);

    let cardsHtml = cardList.length > 0 ? cardList.map(gid => {
        const card = userCards[gid];
        const avatar = `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png?size=256`;
        return `
            <div class="glass-card" style="text-align:center; border: 1px solid #eee;">
                <h3>${card.guildName} Passolig Kartı</h3>
                <div class="final-card">
                    <img src="${CARDS[card.style]}" style="width:100%; height:100%; object-fit:cover;">
                    <div class="final-card-user">
                        <img src="${avatar}" class="final-card-avatar">
                        <div style="text-align:left;">
                            <div style="font-weight:900; font-size:24px; text-transform:uppercase;">${card.name}</div>
                            <div style="font-size:12px; opacity:0.9; font-weight:600;">PASSOLİG DİJİTAL TARAFTAR</div>
                        </div>
                    </div>
                </div>
                <button class="nav-btn" style="background:#333;" onclick="window.print()">KARTI İNDİR</button>
            </div>
        `;
    }).join('') : '<div class="glass-card" style="text-align:center;"><h3>Henüz bir kartın yok.</h3><p>Sunucu seçerek kart başvurusu yapabilirsin.</p></div>';

    res.send(ui(`<h1>Cüzdanım</h1>${cardsHtml}`, req.session.user, 'cards'));
});

// --- AUTH ---
app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        
        const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        
        // Sadece Admin olduğun veya RoPasso botunun ID'sini içeren sunucuları filtrele
        // Not: Gerçekte botun içinde olduğu sunucuları botun kendi guild listesinden çekmek en sağlıklısıdır.
        const passoGuilds = guildsRes.data.filter(g => (g.permissions & 0x8) === 0x8 || g.id === "123456789"); // Örnek filtre

        req.session.user = { ...userRes.data, passoGuilds };
        res.redirect('/dashboard');
    } catch (e) { res.redirect('/'); }
});

app.get('/login', (req, res) => res.redirect(DISCORD_AUTH_URL));
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

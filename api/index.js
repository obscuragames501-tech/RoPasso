const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ropasso-ultra-v2-2026-hub',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- CONFIG & ASSETS ---
const BOT_ID = "1497727912978153482";
const BOT_TOKEN = process.env.BOT_TOKEN; // Botun sunucuları çekebilmesi için şart!
const ASSETS = {
    FAVICON: "https://lens.usercontent.google.com/image?vsrid=CJibkaSkqIa72QEQAhgBIiQyMzU2MzlmNi1kODg2LTQwOTEtOGFjNS1jNThhZDgwMjUwMzIyeyICd2UoEEJzCi5sZmUtZHVtbXk6NTQxY2Q3NzctNDkwZi00ZjY5LTlkNjEtN2UyOGVkOGQ4OTAxEkEKPy9ibnMvd2UvYm9yZy93ZS9ibnMvbGVucy1mcm9udGVuZC1hcGkvcHJvZC5sZW5zLWZyb250ZW5kLWFwaS8zNzjAqP762YuUAw&gsessionid=XaOrQyG0JOwq0uHyqJ4IW_rrsPc4NbTmKPUW3QvUPJOlWyLTGlIDyg",
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png?ex=69ef49ba&is=69edf83a&hm=907abaa3475f136cc06c14450bf639e3c3d355b398a8e30e7736e06ab4453ba3&",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png?ex=69ef560f&is=69ee048f&hm=d35d716fc26ad47519b6ee476497d47416b927315c849153c510113aeddf2f35&",
    OFFICIAL_DISCORD: "https://discord.gg/hsWrzs4FJE",
    CARDS: {
        RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png?ex=69ef53f0&is=69ee0270&hm=c493b951ca7cdbeefb0ff2c4285ae29b2503db1a8d5c9ec7cf3f03740a52e714&",
        BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png?ex=69ef53f0&is=69ee0270&hm=362d0acae669f604ba120ae8535424da79e2ec500b7990a804dc1d4ddf8ab42b&",
        WHITE: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png?ex=69ef53f0&is=69ee0270&hm=8feb571aed2e9bc7b6ff5768e6eebeaf14beddff210017c770c51bfe60d4e34e&"
    }
};

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || BOT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "https://ropasso.vercel.app/api/auth/callback";
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`;
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${BOT_ID}&permissions=8&scope=bot+applications.commands`;

// --- DATABASE SIMULATION ---
let db_announcements = [
    { id: 1, title: "Passolig Sizlerle!", content: "RoPasso altyapısı ile artık stadyum girişleri tamamen dijital ve güvenli.", date: "26.04.2026" },
    { id: 2, title: "Yeni Kart Tasarımları", content: "Kırmızı, Siyah ve Beyaz premium kart seçenekleri aktif edildi.", date: "25.04.2026" }
];

// --- BOTUN SUNUCULARINI ÇEKEN FONKSİYON ---
async function getBotGuilds() {
    try {
        const response = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });
        return response.data;
    } catch (e) {
        console.error("Bot sunucuları çekilemedi:", e.message);
        return [];
    }
}

// --- ARAYÜZ ŞABLONU ---
const ui = (body, user = null) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="${ASSETS.FAVICON}">
    <title>RoPasso | Bot Hub</title>
    <style>
        :root { --primary: #e30613; --secondary: #1d1d1f; --bg: #0f0f10; --card-bg: #1a1a1c; --text: #ffffff; }
        * { box-sizing: border-box; font-family: 'SF Pro Display', -apple-system, sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--text); overflow-x: hidden; }
        
        .navbar { background: rgba(20, 20, 22, 0.8); backdrop-filter: blur(20px); height: 75px; display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 1000; border-bottom: 1px solid rgba(255,255,255,0.05); animation: fadeInDown 0.8s ease; }
        .nav-btn { background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; border: none; cursor: pointer; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .nav-btn:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(227,6,19,0.4); }

        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; animation: fadeIn 1s ease; }
        .glass-card { background: var(--card-bg); border-radius: 28px; padding: 30px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 30px; transition: 0.3s; }
        .glass-card:hover { border-color: var(--primary); }
        
        .hero { position: relative; height: 380px; border-radius: 35px; overflow: hidden; margin-bottom: 40px; background: url('${ASSETS.NEWS_BANNER}') center/cover; animation: zoomIn 1.2s ease; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,15,16,1), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 50px; }

        .search-bar { width: 100%; padding: 20px; border-radius: 18px; border: 1px solid #333; background: #1a1a1c; color: white; font-size: 18px; margin-bottom: 30px; outline: none; transition: 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .search-bar:focus { border-color: var(--primary); box-shadow: 0 0 15px rgba(227,6,19,0.2); }

        .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .server-card { background: #1a1a1c; border-radius: 22px; padding: 20px; display: flex; align-items: center; gap: 15px; border: 1px solid #222; transition: 0.4s; text-decoration: none; color: inherit; animation: fadeInUp 0.5s ease backwards; }
        .server-card:hover { transform: translateY(-5px); border-color: var(--primary); background: #222225; }
        .server-icon { width: 65px; height: 65px; border-radius: 18px; object-fit: cover; border: 2px solid #333; }

        .card-preview { display: flex; gap: 10px; margin-top: 20px; justify-content: center; }
        .card-img { width: 80px; border-radius: 8px; cursor: pointer; transition: 0.3s; border: 2px solid transparent; }
        .card-img:hover { transform: scale(1.2) rotate(5deg); border-color: var(--primary); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomIn { from { transform: scale(1.1); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    </style>
</head>
<body>
    <div class="navbar">
        <div style="display:flex; align-items:center; gap:20px;">
            <img src="${ASSETS.LOGO}" height="45" onclick="location.href='/'" style="cursor:pointer">
            <a href="${ASSETS.OFFICIAL_DISCORD}" target="_blank" class="nav-btn" style="background:#5865F2;">RESMİ SUNUCU</a>
        </div>
        <div style="display:flex; gap:15px; align-items:center;">
            <a href="${BOT_INVITE_URL}" target="_blank" class="nav-btn">BOTU EKLE</a>
            ${user ? `<div style="text-align:right"><div style="font-weight:700;">${user.username}</div><a href="/logout" style="color:var(--primary); font-size:11px; text-decoration:none;">ÇIKIŞ YAP</a></div>` : `<a href="/login" class="nav-btn" style="background:#333;">GİRİŞ YAP</a>`}
        </div>
    </div>
    <div class="container">${body}</div>

    <script>
        function filterServers() {
            let val = document.getElementById('serverSearch').value.toLowerCase();
            document.querySelectorAll('.server-card').forEach(card => {
                let name = card.getAttribute('data-name').toLowerCase();
                card.style.display = name.includes(val) ? 'flex' : 'none';
            });
        }
    </script>
</body>
</html>`;

// --- ROUTES ---

app.get('/', async (req, res) => {
    const botGuilds = await getBotGuilds(); // Botun gerçek sunucularını çekiyoruz

    let announcementsHtml = db_announcements.map(a => `
        <div style="margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #222;">
            <div style="display:flex; justify-content:space-between;">
                <b style="color:var(--primary)">${a.title}</b>
                <small style="color:#555;">${a.date}</small>
            </div>
            <p style="margin:8px 0; font-size:14px; color:#aaa;">${a.content}</p>
        </div>
    `).join('');

    let serversHtml = botGuilds.length > 0 ? botGuilds.map((s, index) => `
        <a href="https://discord.com/channels/${s.id}" target="_blank" class="server-card" data-name="${s.name}" style="animation-delay: ${index * 0.1}s">
            <img src="https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png" class="server-icon" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random&color=fff'">
            <div>
                <div style="font-weight:700; font-size:16px;">${s.name}</div>
                <div style="font-size:12px; color:#666;">Aktif RoPasso Sistemi</div>
            </div>
        </a>
    `).join('') : '<div style="color:#555; text-align:center; grid-column: 1/-1;">Henüz aktif sistemli sunucu bulunamadı.</div>';

    res.send(ui(`
        <div class="hero">
            <div class="hero-overlay">
                <h1 style="font-size:48px; margin:0; letter-spacing:-2px;">Yeni Nesil Passo</h1>
                <p style="font-size:20px; color:#ccc; max-width:600px;">Discord sunucunu stadyuma çevir. Biletini al, kartını oluştur, tribündeki yerini al.</p>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:30px;">
            <div>
                <input type="text" id="serverSearch" class="search-bar" placeholder="Sunucu ara (Ankaragücü, Eryaman...)" onkeyup="filterServers()">
                <h2 style="margin-bottom:25px; display:flex; align-items:center; gap:10px;">
                    <span style="width:10px; height:30px; background:var(--primary); border-radius:5px;"></span>
                    Sistemdeki Aktif Sunucular
                </h2>
                <div class="server-grid">
                    ${serversHtml}
                </div>
            </div>
            <div>
                <div class="glass-card">
                    <h3 style="margin-top:0;">📢 Duyurular</h3>
                    ${announcementsHtml}
                </div>
                <div class="glass-card" style="text-align:center;">
                    <h3>Kart Tasarımları</h3>
                    <p style="font-size:13px; color:#777;">Bot üzerinden seçebileceğin modeller</p>
                    <div class="card-preview">
                        <img src="${ASSETS.CARDS.RED}" class="card-img" title="Kırmızı Passo">
                        <img src="${ASSETS.CARDS.BLACK}" class="card-img" title="Siyah Passo">
                        <img src="${ASSETS.CARDS.WHITE}" class="card-img" title="Beyaz Passo">
                    </div>
                </div>
            </div>
        </div>
    `, req.session.user));
});

// --- AUTH ---
app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        
        const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        req.session.user = userRes.data;
        res.redirect('/');
    } catch (e) { res.redirect('/'); }
});

app.get('/login', (req, res) => res.redirect(DISCORD_AUTH_URL));
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

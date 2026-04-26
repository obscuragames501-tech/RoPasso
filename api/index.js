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
const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png",
    BOT_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497738166235430972/Gemini_Generated_Image_o1s4jao1s4jao1s4.png"
};

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || BOT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "https://ropasso.vercel.app/api/auth/callback";
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`;
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${BOT_ID}&permissions=8&scope=bot+applications.commands`;

// --- DATABASE SIMULATION (Sistemdeki Aktif Sunucular) ---
let db_announcements = [
    { id: 1, title: "RoPasso Hub Yayında", content: "Artık tüm biletleme ve kart işlemleri Discord botumuz üzerinden yürütülecektir.", date: "26.04.2026" },
    { id: 2, title: "V2 Güncellemesi", content: "Bot komutları /passo olarak güncellendi. Slash komutlarını kullanmayı unutmayın.", date: "25.04.2026" }
];

// Botun aktif olduğu varsayılan büyük sunucular (Örnek Data)
let active_servers = [
    { id: "1", name: "Ankaragücü Roleplay", members: "4.2k", invite: "https://discord.gg/ank-rp", icon: "https://cdn.discordapp.com/icons/123/a.png" },
    { id: "2", name: "Eryaman Stadium Official", members: "1.8k", invite: "https://discord.gg/eryaman", icon: "https://cdn.discordapp.com/icons/124/b.png" },
    { id: "3", name: "Super League RBX", members: "12k", invite: "#", icon: "https://cdn.discordapp.com/icons/125/c.png" }
];

// --- ARAYÜZ ŞABLONU ---
const ui = (body, user = null) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Bot Hub</title>
    <style>
        :root { --primary: #e30613; --secondary: #1d1d1f; --bg: #f2f2f7; --glass: rgba(255, 255, 255, 0.9); }
        * { box-sizing: border-box; font-family: 'SF Pro Display', -apple-system, sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--secondary); }
        
        .navbar { background: var(--glass); backdrop-filter: blur(20px); height: 75px; display: flex; align-items: center; justify-content: space-between; padding: 0 50px; position: sticky; top: 0; z-index: 1000; border-bottom: 1px solid rgba(0,0,0,0.08); }
        .nav-btn { background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; border: none; cursor: pointer; transition: 0.3s; }
        .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(227,6,19,0.3); }

        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: #fff; border-radius: 28px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); margin-bottom: 30px; }
        
        .hero { position: relative; height: 350px; border-radius: 35px; overflow: hidden; margin-bottom: 40px; background: url('${ASSETS.NEWS_BANNER}') center/cover; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 50px; color: white; }

        .search-bar { width: 100%; padding: 20px; border-radius: 15px; border: 2px solid #eee; font-size: 18px; margin-bottom: 30px; outline: none; transition: 0.3s; }
        .search-bar:focus { border-color: var(--primary); }

        .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .server-card { background: #fff; border-radius: 20px; padding: 20px; display: flex; align-items: center; gap: 15px; border: 1px solid #eee; transition: 0.3s; text-decoration: none; color: inherit; }
        .server-card:hover { transform: scale(1.02); border-color: var(--primary); }
        .server-icon { width: 60px; height: 60px; border-radius: 15px; background: #eee; }

        .badge { background: #5865F2; color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="navbar">
        <img src="${ASSETS.PASSO_NAV}" height="32" onclick="location.href='/'" style="cursor:pointer">
        <div style="display:flex; gap:15px; align-items:center;">
            <a href="${BOT_INVITE_URL}" target="_blank" class="nav-btn" style="background:#5865F2;">BOTU EKLE</a>
            ${user ? `<span style="font-weight:600;">${user.username}</span> <a href="/logout" style="color:#666; font-size:12px;">Çıkış</a>` : `<a href="/login" class="nav-btn">GİRİŞ YAP</a>`}
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

app.get('/', (req, res) => {
    let announcementsHtml = db_announcements.map(a => `
        <div style="margin-bottom:15px;">
            <b style="color:var(--primary)">${a.date}</b> - ${a.title}
            <p style="margin:5px 0; font-size:14px; color:#666;">${a.content}</p>
        </div>
    `).join('');

    let serversHtml = active_servers.map(s => `
        <a href="${s.invite}" target="_blank" class="server-card" data-name="${s.name}">
            <img src="${s.icon}" class="server-icon" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=random'">
            <div>
                <div style="font-weight:700;">${s.name}</div>
                <div style="font-size:12px; color:#888;">${s.members} Üye • <span style="color:green;">Aktif</span></div>
            </div>
        </a>
    `).join('');

    res.send(ui(`
        <div class="hero">
            <div class="hero-overlay">
                <h1 style="font-size:42px; margin:0;">RoPasso Bot Ekosistemi</h1>
                <p style="font-size:18px; opacity:0.9;">Roblox maç atmosferini Discord'a taşıyoruz. Botu ekle, kartını sunucunda oluştur.</p>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:30px;">
            <div>
                <input type="text" id="serverSearch" class="search-bar" placeholder="Sistemdeki sunucuları ara..." onkeyup="filterServers()">
                <h2>Aktif Stadyumlar & Sunucular</h2>
                <div class="server-grid">
                    ${serversHtml}
                </div>
            </div>
            <div>
                <div class="glass-card" style="padding:20px;">
                    <h3>📢 Son Güncellemeler</h3>
                    ${announcementsHtml}
                </div>
                <div class="glass-card" style="padding:20px; background: var(--secondary); color: white;">
                    <h3>🤖 Botu Yönet</h3>
                    <p style="font-size:14px; opacity:0.8;">Kendi sunucuna RoPasso kurmak ve taraftar kartlarını aktif etmek için hemen davet et.</p>
                    <a href="${BOT_INVITE_URL}" target="_blank" class="nav-btn" style="width:100%; text-align:center; display:block;">HEMEN DAVET ET</a>
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

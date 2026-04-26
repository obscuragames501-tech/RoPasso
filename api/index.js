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

const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    ERROR: "https://www.freeiconspng.com/thumbs/error-icon/error-icon-4.png",
    BOT_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497738166235430972/Gemini_Generated_Image_o1s4jao1s4jao1s4.png?ex=69ef459d&is=69edf41d&hm=2f2bd458f0d489b8f65241459f56b9f806b0ec5a39218e821da900ea1e1eff9c&",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png?ex=69ef560f&is=69ee048f&hm=d35d716fc26ad47519b6ee476497d47416b927315c849153c510113aeddf2f35&",
    ROBLOX_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935107258843247/image.png?ex=69ef5447&is=69ee02c7&hm=48bc56cd2c521c25fe37875dc5b042efb78ce0b319579a50605320e8beb42883&",
    DISCORD_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935416429383801/image.png?ex=69ef5491&is=69ee0311&hm=af264f338c94cda7b6acd860735cb31be9b86bc385428050f4cc8350911d2a0b&"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png?ex=69ef53f0&is=69ee0270&hm=c493b951ca7cdbeefb0ff2c4285ae29b2503db1a8d5c9ec7cf3f03740a52e714&",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png?ex=69ef53f0&is=69ee0270&hm=362d0acae669f604ba120ae8535424da79e2ec500b7990a804dc1d4ddf8ab42b&",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png?ex=69ef53f0&is=69ee0270&hm=8feb571aed2e9bc7b6ff5768e6eebeaf14beddff210017c770c51bfe60d4e34e&"
};

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1497727912978153482";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = "https://ropasso.vercel.app/api/auth/callback";
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`;
const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&integration_type=0&scope=identify+guilds.members.read+guilds+bot+applications.commands`;

let db_cards = {};

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
        .nav-link { text-decoration: none; color: #666; font-weight: 600; font-size: 14px; transition: 0.2s; cursor: pointer; }
        .nav-link:hover, .nav-link.active { color: var(--primary); }
        .nav-btn { background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; border: none; cursor: pointer; display: inline-block; }
        .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(227,6,19,0.3); }

        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: #fff; border-radius: 28px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); margin-bottom: 30px; border: 1px solid rgba(0,0,0,0.02); }

        /* HERO AREA */
        .hero { position: relative; height: 450px; border-radius: 35px; overflow: hidden; margin-bottom: 40px; background: url('${ASSETS.NEWS_BANNER}') center/cover; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; color: white; }

        /* SERVER DROPDOWN */
        .dropdown { position: relative; display: inline-block; }
        .dropdown-content { display: none; position: absolute; background: white; min-width: 250px; border-radius: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); z-index: 10; margin-top: 10px; border: 1px solid #eee; overflow: hidden; }
        .dropdown:hover .dropdown-content { display: block; animation: slideUp 0.3s ease; }
        .dropdown-item { padding: 15px 20px; text-decoration: none; color: #333; display: flex; align-items: center; gap: 10px; font-weight: 600; border-bottom: 1px solid #f9f9f9; }
        .dropdown-item:hover { background: #f8f8f8; color: var(--primary); }

        /* KART TASARIMI GÜNCEL */
        .final-card { position: relative; width: 450px; height: 284px; border-radius: 22px; overflow: hidden; margin: 30px auto; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
        .final-card-user { position: absolute; bottom: 30px; left: 30px; display: flex; align-items: center; gap: 18px; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .final-card-avatar { width: 85px; height: 85px; border-radius: 50%; border: 4px solid #fff; object-fit: cover; background: #222; }

        .input-box { width: 100%; padding: 16px; border-radius: 14px; border: 2px solid #eee; margin-top: 8px; font-size: 16px; transition: 0.3s; }
        .input-box:focus { border-color: var(--primary); outline: none; background: #fff; }

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
                    ${user && user.guilds ? user.guilds.map(g => `<a href="/server/${g.id}" class="dropdown-item"><b>#</b> ${g.name}</a>`).join('') : '<div class="dropdown-item">Önce Giriş Yapın</div>'}
                </div>
            </div>
            <a href="/my-cards" class="nav-link ${activePage==='cards'?'active':''}">Kartlarım</a>
            <a href="/apply" class="nav-link ${activePage==='apply'?'active':''}">Başvuru</a>
            ${user ? `<a href="/logout" class="nav-btn" style="background:#333;">Çıkış Yap</a>` : `<a href="/login" class="nav-btn">Giriş Yap</a>`}
        </div>
    </div>

    <div class="container">
        ${body}
    </div>

    <script>
        // Sayfa içi yumuşak geçişler ve efektler
        document.querySelectorAll('.glass-card').forEach(card => {
            card.style.opacity = '0';
            setTimeout(() => {
                card.style.transition = '1s';
                card.style.opacity = '1';
            }, 100);
        });
    </script>
</body>
</html>`;

// --- ROUTER ---

app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.send(ui(`
        <div style="text-align:center; padding: 100px 0;">
            <img src="${ASSETS.LOGO}" width="300" style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));">
            <h1 style="font-size:55px; font-weight:900; letter-spacing:-2px; margin: 20px 0;">Yeni Nesil Passo</h1>
            <p style="color:#666; font-size:20px; max-width:600px; margin: 0 auto 40px auto;">Roblox stadyumlarına tek tıkla bilet al, taraftar kartını cüzdanına ekle.</p>
            <div style="display:flex; justify-content:center; gap:20px;">
                <a href="${DISCORD_AUTH_URL}" class="nav-btn" style="padding: 20px 50px; font-size:18px; background:#5865F2;">Discord ile Giriş Yap</a>
            </div>
        </div>
    `));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="hero">
            <div class="hero-overlay">
                <h1 style="font-size:50px; margin:0;">Eryaman'da Maç Heyecanı!</h1>
                <p style="font-size:20px; opacity:0.8;">Hemen kartını oluştur ve biletini rezerve et.</p>
                <a href="/apply" class="nav-btn" style="width:fit-content; margin-top:20px;">Kart Başvurusu Yap</a>
            </div>
        </div>
        <div class="glass-card">
            <h2>Hoş geldin, ${req.session.user.username}!</h2>
            <p>Aşağı kaydırarak sistemdeki duyuruları ve aktif maçları görebilirsin.</p>
        </div>
    `, req.session.user, 'home'));
});

// BOT EKLEME VE TUTORIAL
app.get('/add-bot', (req, res) => {
    res.send(ui(`
        <div class="glass-card" style="text-align:center;">
            <img src="${ASSETS.BOT_BANNER}" style="width:100%; border-radius:20px; margin-bottom:30px;">
            <h1>RoPasso Botu Sunucuna Kur</h1>
            <p style="color:#666;">Aşağıdaki videoyu izleyerek 2 dakikada kurulumu tamamlayabilirsin.</p>
            
            <div style="margin:40px 0; border-radius:20px; overflow:hidden; background:#000;">
                <iframe width="100%" height="450" src="https://www.youtube.com/embed/YnhMmC3PGu0" frameborder="0" allowfullscreen></iframe>
            </div>

            <a href="${BOT_INVITE_URL}" class="nav-btn" style="padding:25px 60px; font-size:20px; background:#5865F2;">BOTU SUNUCUYA EKLE</a>
        </div>
    `, req.session.user));
});

// SUNUCU DETAY VE ETKİNLİK
app.get('/server/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="glass-card" style="text-align:center; padding:100px 0;">
            <img src="${ASSETS.ERROR}" width="120" style="margin-bottom:30px;">
            <h1 style="color:#333;">Etkinlik Bulunamadı</h1>
            <p style="color:#888; font-size:18px;">Bu sunucu için şu an tanımlanmış bir maç veya etkinlik bulunmuyor.</p>
            <a href="/dashboard" class="nav-btn" style="margin-top:30px; background:#333;">Geri Dön</a>
        </div>
    `, req.session.user, 'servers'));
});

app.get('/apply', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="glass-card" style="max-width:800px; margin:auto;">
            <h2 style="text-align:center;">Kart Başvurusu</h2>
            <form action="/apply-card" method="POST">
                <label>Roblox Kullanıcı Adı</label>
                <input type="text" name="roblox_name" class="input-box" required>
                
                <label style="margin-top:20px;">Roblox ID</label>
                <input type="text" name="roblox_id" class="input-box" required>
                <img src="${ASSETS.ROBLOX_HELP}" style="width:100%; border-radius:15px; margin-top:10px;">

                <h3 style="margin-top:40px;">Tasarım Seç</h3>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:15px;">
                    <label style="cursor:pointer;"><input type="radio" name="style" value="RED" checked> <img src="${CARDS.RED}" width="100%"></label>
                    <label style="cursor:pointer;"><input type="radio" name="style" value="BLACK"> <img src="${CARDS.BLACK}" width="100%"></label>
                    <label style="cursor:pointer;"><input type="radio" name="style" value="PATTERN"> <img src="${CARDS.PATTERN}" width="100%"></label>
                </div>

                <button type="submit" class="nav-btn" style="width:100%; margin-top:40px; padding:20px;">BAŞVURUYU TAMAMLA</button>
            </form>
        </div>
    `, req.session.user, 'apply'));
});

app.get('/my-cards', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const card = db_cards[req.session.user.id];
    if (!card) return res.redirect('/apply');

    // Discord Profil Resmi Çekme
    const discordAvatar = `https://cdn.discordapp.com/avatars/${req.session.user.id}/${req.session.user.avatar}.png?size=256`;
    
    res.send(ui(`
        <div class="glass-card" style="text-align:center;">
            <h1>Dijital Kartın Hazır!</h1>
            <div class="final-card">
                <img src="${CARDS[card.style]}" style="width:100%; height:100%; object-fit:cover;">
                <div class="final-card-user">
                    <img src="${discordAvatar}" class="final-card-avatar" onerror="this.src='${ASSETS.FOUNDER}'">
                    <div style="text-align:left;">
                        <div style="font-weight:900; font-size:24px; text-transform:uppercase;">${card.name}</div>
                        <div style="font-size:12px; opacity:0.9; font-weight:600;">PASSOLİG DİJİTAL TARAFTAR</div>
                    </div>
                </div>
            </div>
            <p style="color:#888; margin-top:20px;">Bu kart sunucularda kimlik doğrulaması için kullanılır.</p>
        </div>
    `, req.session.user, 'cards'));
});

// AUTH CALLBACK
app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        
        const userRes = await axios.get('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
        
        req.session.user = { ...userRes.data, guilds: guildsRes.data.filter(g => (g.permissions & 0x8) === 0x8) }; // Sadece yönetici olduğu sunucular
        res.redirect('/dashboard');
    } catch (e) { res.redirect('/'); }
});

app.post('/apply-card', (req, res) => {
    if (req.session.user) db_cards[req.session.user.id] = { name: req.body.roblox_name, id: req.body.roblox_id, style: req.body.style };
    res.redirect('/my-cards');
});

app.get('/login', (req, res) => res.redirect(DISCORD_AUTH_URL));
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

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

// GÜNCEL TOKENLI ASSETLER
const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_NAV: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    DISCORD_WHITE: "https://cdn.discordapp.com/attachments/1497741754777079829/1497743438798389268/39-393163_company-discord-logo-png-white-Photoroom.png",
    FOUNDER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937318336528446/noFilter.png?ex=69ef5657&is=69ee04d7&hm=37c8c041ff65462ed29d619bbcdf8d7ea62c49b33e7b0669f1f59df86d06a4b2&",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png?ex=69ef560f&is=69ee048f&hm=d35d716fc26ad47519b6ee476497d47416b927315c849153c510113aeddf2f35&",
    DISCORD_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935416429383801/image.png?ex=69ef5491&is=69ee0311&hm=af264f338c94cda7b6acd860735cb31be9b86bc385428050f4cc8350911d2a0b&",
    ROBLOX_HELP: "https://cdn.discordapp.com/attachments/1495543284423065662/1497935107258843247/image.png?ex=69ef5447&is=69ee02c7&hm=48bc56cd2c521c25fe37875dc5b042efb78ce0b319579a50605320e8beb42883&"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png?ex=69ef53f0&is=69ee0270&hm=c493b951ca7cdbeefb0ff2c4285ae29b2503db1a8d5c9ec7cf3f03740a52e714&",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png?ex=69ef53f0&is=69ee0270&hm=362d0acae669f604ba120ae8535424da79e2ec500b7990a804dc1d4ddf8ab42b&",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png?ex=69ef53f0&is=69ee0270&hm=8feb571aed2e9bc7b6ff5768e6eebeaf14beddff210017c770c51bfe60d4e34e&"
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
    <title>RoPasso | Dijital Kart Sistemi</title>
    <style>
        :root { --primary: #e30613; --bg: #f5f5f7; }
        * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        body { margin: 0; background-color: var(--bg); color: #1d1d1f; }
        
        /* NAVBAR */
        .navbar { background: #fff; height: 75px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; box-shadow: 0 2px 15px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 1000; }
        .nav-links { display: flex; gap: 25px; align-items: center; }
        .nav-link { text-decoration: none; color: #444; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .nav-link:hover, .nav-link.active { color: var(--primary); }
        .nav-btn { background: var(--primary); color: #fff; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 13px; }

        .container { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
        .glass-card { background: #fff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); margin-bottom: 30px; }

        /* KART SHOWCASE SEÇİMİ */
        .showcase-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 25px 0; }
        .card-option { border: 3px solid transparent; border-radius: 15px; overflow: hidden; cursor: pointer; position: relative; }
        .card-option img { width: 100%; display: block; }
        .card-option input { display: none; }
        .card-option:has(input:checked) { border-color: var(--primary); box-shadow: 0 0 20px rgba(227, 6, 19, 0.2); }

        /* FORM ELEMANLARI */
        .input-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 700; font-size: 14px; }
        input[type="text"] { width: 100%; padding: 14px; border-radius: 12px; border: 2px solid #eee; background: #fafafa; font-size: 16px; }
        input:focus { border-color: var(--primary); outline: none; }
        .help-img { width: 100%; border-radius: 12px; margin-top: 10px; border: 1px solid #ddd; }

        /* ANA SAYFA HABER PANELİ */
        .hero-banner { height: 400px; border-radius: 30px; background: url('${ASSETS.NEWS_BANNER}') center/cover; position: relative; display: flex; align-items: flex-end; padding: 50px; color: #fff; margin-bottom: 40px; }
        .hero-banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 70%); border-radius: 30px; }
        .hero-content { position: relative; z-index: 2; }

        /* KART GÖRÜNÜMÜ */
        .final-card { position: relative; width: 450px; aspect-ratio: 1.58/1; border-radius: 20px; overflow: hidden; margin: 20px auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
        .final-card-user { position: absolute; bottom: 25px; left: 25px; display: flex; align-items: center; gap: 15px; color: white; }
        .final-card-avatar { width: 75px; height: 75px; border-radius: 50%; border: 3px solid white; background: #222; }
    </style>
</head>
<body>
    <div class="navbar">
        <img src="${ASSETS.PASSO_NAV}" height="35" onclick="location.href='/dashboard'" style="cursor:pointer">
        <div class="nav-links">
            <a href="/dashboard" class="nav-link ${activePage==='home'?'active':''}">Ana Sayfa</a>
            <a href="/my-cards" class="nav-link ${activePage==='cards'?'active':''}">Kartlarım</a>
            <a href="/apply" class="nav-link ${activePage==='apply'?'active':''}">Kart Başvurusu</a>
            ${user ? `<a href="/logout" class="nav-btn" style="background:#333;">Çıkış</a>` : `<a href="/login" class="nav-btn">Giriş Yap</a>`}
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
        <div style="text-align:center; padding: 80px 0;">
            <img src="${ASSETS.LOGO}" width="280">
            <h1 style="font-size:45px; font-weight:900; margin-top:20px;">Dijital Futbol Dünyasına Katıl</h1>
            <p style="color:#666; font-size:18px; margin-bottom:30px;">Roblox biletlerini yönetmek için Discord ile giriş yap.</p>
            <a href="${DISCORD_AUTH_URL}" class="nav-btn" style="padding: 18px 40px; font-size:16px; background:#5865F2;">Discord ile Bağlan</a>
        </div>
    `));
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="hero-banner">
            <div class="hero-content">
                <span style="background:var(--primary); padding:5px 12px; border-radius:5px; font-weight:800; font-size:12px;">YENİ</span>
                <h1 style="font-size:48px; margin:10px 0;">RoPasso Artık Yayında!</h1>
                <p style="opacity:0.9; font-size:18px;">Eryaman Stadyumu ve tüm dijital sahalar için biletini şimdi al.</p>
            </div>
        </div>
        <div class="glass-card">
            <h2>Hakkımızda</h2>
            <p style="line-height:1.7; color:#555; margin-top:15px;">RoPasso, Roblox tabanlı spor müsabakaları için geliştirilmiş ilk ve tek kapsamlı dijital kart sistemidir. Kullanıcılar Discord hesapları ile Roblox kimliklerini eşleştirerek sahalara giriş hakkı kazanırlar.</p>
        </div>
    `, req.session.user, 'home'));
});

app.get('/apply', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.send(ui(`
        <div class="glass-card" style="max-width:900px; margin:auto;">
            <h2 style="text-align:center;">Kart Başvurusu</h2>
            <p style="text-align:center; color:#888; font-size:14px; margin-bottom:30px;">Bilgilerini doldur ve tasarımını seç.</p>
            <form action="/apply-card" method="POST">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:40px;">
                    <div>
                        <div class="input-group">
                            <label>Roblox Kullanıcı Adı</label>
                            <input type="text" name="roblox_name" placeholder="Örn: Xe1lea" required>
                        </div>
                        <div class="input-group">
                            <label>Roblox ID</label>
                            <input type="text" name="roblox_id" placeholder="12345678" required>
                            <img src="${ASSETS.ROBLOX_HELP}" class="help-img">
                        </div>
                        <div class="input-group">
                            <label>Discord Profil Linki</label>
                            <input type="text" name="discord_url" placeholder="https://discord.com/users/..." required>
                            <img src="${ASSETS.DISCORD_HELP}" class="help-img">
                        </div>
                    </div>
                    <div>
                        <label>Kart Tasarımı Seçin</label>
                        <div class="showcase-grid">
                            <label class="card-option"><input type="radio" name="card_style" value="RED" checked><img src="${CARDS.RED}"></label>
                            <label class="card-option"><input type="radio" name="card_style" value="BLACK"><img src="${CARDS.BLACK}"></label>
                            <label class="card-option"><input type="radio" name="card_style" value="PATTERN"><img src="${CARDS.PATTERN}"></label>
                        </div>
                        <button type="submit" class="nav-btn" style="width:100%; padding:20px; font-size:16px; margin-top:20px; cursor:pointer;">KARTI OLUŞTUR</button>
                    </div>
                </div>
            </form>
        </div>
    `, req.session.user, 'apply'));
});

app.get('/my-cards', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const userCard = db_cards[req.session.user.id];
    
    if (!userCard) {
        return res.send(ui(`
            <div class="glass-card" style="text-align:center; padding:100px 0;">
                <h2 style="color:#ccc;">Henüz bir kartın bulunmuyor.</h2>
                <a href="/apply" class="nav-btn" style="display:inline-block; margin-top:20px;">Hemen Başvur</a>
            </div>
        `, req.session.user, 'cards'));
    }

    const headshot = `https://www.roblox.com/headshot-thumbnail/image?userId=${userCard.id}&width=420&height=420&format=png`;
    res.send(ui(`
        <div class="glass-card" style="text-align:center;">
            <h1>Dijital Kartınız</h1>
            <div class="final-card">
                <img src="${CARDS[userCard.style]}" style="width:100%;">
                <div class="final-card-user">
                    <img src="${headshot}" class="final-card-avatar" onerror="this.src='${ASSETS.FOUNDER}'">
                    <div style="text-align:left;">
                        <div style="font-weight:900; font-size:22px; text-transform:uppercase; letter-spacing:1px;">${userCard.name}</div>
                        <div style="font-size:12px; opacity:0.8; font-weight:600;">AKTİF TARAFTAR</div>
                    </div>
                </div>
            </div>
            <div style="margin-top:30px;">
                <button onclick="location.href='/cancel-card'" style="background:none; border:none; color:#e30613; font-weight:800; cursor:pointer; text-decoration:underline;">Kartı İptal Et</button>
            </div>
        </div>
    `, req.session.user, 'cards'));
});

// --- API & AUTH ---

app.get('/login', (req, res) => res.redirect(DISCORD_AUTH_URL));

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

app.post('/apply-card', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    db_cards[req.session.user.id] = { name: req.body.roblox_name, id: req.body.roblox_id, style: req.body.card_style };
    res.redirect('/my-cards');
});

app.get('/cancel-card', (req, res) => {
    if (req.session.user) delete db_cards[req.session.user.id];
    res.redirect('/apply');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = app;

const express = require('express');
const axios = require('axios');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ropasso-final-ultra-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 saat boyunca login kalır
}));

// ASSET VE LOGO TANIMLARI
const ASSETS = {
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    PASSO_WHITE: "https://cdn.passo.com.tr/passotaraftar/public/logo.svg",
    DISCORD: "https://cdn.discordapp.com/attachments/1497741754777079829/1497743438798389268/39-393163_company-discord-logo-png-white-Photoroom.png",
    ROBLOX: "https://cdn.discordapp.com/attachments/1497741754777079829/1497937507419951225/Roblox_Logo_2025.png",
    NEWS_IMG: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png",
    FOUNDER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937318336528446/noFilter.png"
};

const CARDS = {
    RED: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934738898554921/Gemini_Generated_Image_cgvwwxcgvwwxcgvw-Photoroom.png",
    BLACK: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739217055904/Gemini_Generated_Image_7qiplh7qiplh7qip-Photoroom.png",
    PATTERN: "https://cdn.discordapp.com/attachments/1495543284423065662/1497934739548668005/Gemini_Generated_Image_r9czspr9czspr9cz-Photoroom_1.png"
};

// VERCEL AYARLARI
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1497727912978153482";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "https://ropasso.vercel.app/api/auth/callback";
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify+guilds`;

// SAHTE VERİTABANI (PROD İÇİN MONGODB LAZIM AMA TEST İÇİN RAM'DE TUTUYORUZ)
let db_cards = {};

const ui = (body, user = null) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoPasso | Dijital Futbol Dünyası</title>
    <style>
        :root { --primary: #e30613; --bg: #f5f5f7; }
        * { box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        body { margin: 0; background-color: var(--bg); color: #1d1d1f; }
        
        /* TOPBAR */
        .topbar { background: #fff; height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 1000; }
        .topbar .logo { height: 40px; cursor: pointer; }
        .topbar .nav-btn { background: var(--primary); color: #fff; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; }
        .topbar .nav-btn:hover { background: #b0050f; transform: translateY(-2px); }

        /* CONTENT AREA */
        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .hero-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-bottom: 50px; }
        
        /* CARD STYLING */
        .glass-card { background: #fff; border-radius: 24px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .passo-card-preview { position: relative; width: 100%; aspect-ratio: 1.58/1; border-radius: 15px; overflow: hidden; margin-top: 20px; color: #fff; }
        .card-bg { width: 100%; height: 100%; object-fit: cover; }
        .card-user-info { position: absolute; bottom: 20px; left: 20px; display: flex; align-items: center; gap: 15px; }
        .card-avatar { width: 60px; height: 60px; border-radius: 50%; border: 3px solid #fff; background: #222; }
        .card-name { font-weight: 800; font-size: 18px; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

        /* FORM */
        .form-group { margin-bottom: 20px; text-align: left; }
        label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
        input, select { width: 100%; padding: 14px; border-radius: 12px; border: 2px solid #eee; background: #fafafa; font-size: 16px; }
        input:focus { border-color: var(--primary); outline: none; }

        /* NEWS SECTION */
        .news-card { display: flex; gap: 20px; background: #fff; border-radius: 20px; overflow: hidden; margin-top: 20px; text-decoration: none; color: inherit; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .news-card img { width: 300px; height: 180px; object-fit: cover; }
        .news-content { padding: 20px; flex: 1; }
        .news-content h3 { margin: 0 0 10px; font-size: 24px; font-weight: 800; }
        
        /* FOUNDER SECTION */
        .founder-box { background: #111; color: #fff; padding: 40px; border-radius: 30px; display: flex; align-items: center; gap: 30px; margin-top: 60px; }
        .founder-box img { width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--primary); }
        .social-links { display: flex; gap: 15px; margin-top: 15px; }
        .social-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #222; border-radius: 10px; }
        .social-btn img { width: 24px; height: 24px; border: none; border-radius: 0; }

        .btn-action { background: var(--primary); color: #fff; padding: 18px; border: none; border-radius: 15px; width: 100%; font-size: 18px; font-weight: 800; cursor: pointer; margin-top: 20px; }
        .btn-action:disabled { background: #ccc; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="topbar">
        <img src="${ASSETS.PASSO_WHITE}" class="logo" onclick="location.href='/dashboard'">
        <div style="display:flex; align-items:center; gap:20px;">
            <a href="/dashboard" class="nav-link" style="text-decoration:none; color:#555; font-weight:700;">ANA SAYFA</a>
            ${user ? `<a href="/logout" class="nav-btn" style="background:#333;">ÇIKIŞ YAP</a>` : `<a href="/login" class="nav-btn">GİRİŞ YAP</a>`}
        </div>
    </div>

    <div class="container">
        ${body}
        
        <hr style="border:0; height:1px; background:#ddd; margin: 60px 0;">
        
        <h2>Haberler & Duyurular</h2>
        <a href="#" class="news-card">
            <img src="${ASSETS.NEWS_IMG}">
            <div class="news-content">
                <h3>RoPasso Artık Sizinle!</h3>
                <p>Türkiye'nin ilk Roblox tabanlı dijital bilet ve taraftar kartı sistemi yayına girdi. Artık Eryaman'da yeriniz hazır!</p>
                <span style="color:var(--primary); font-weight:700;">Devamını Oku →</span>
            </div>
        </a>

        <div class="founder-box">
            <img src="${ASSETS.FOUNDER}">
            <div>
                <span style="color:var(--primary); font-weight:800; letter-spacing:1px;">KURUCU MİMAR</span>
                <h2 style="margin:5px 0;">Xe1lea (Pundk)</h2>
                <p style="opacity:0.7;">RoPasso altyapısı ve dijital sistemlerin baş geliştiricisi.</p>
                <div class="social-links">
                    <a href="https://www.roblox.com/users/727151493/profile" target="_blank" class="social-btn"><img src="${ASSETS.ROBLOX}"></a>
                    <div class="social-btn" title="Discord: xe1lea"><img src="${ASSETS.DISCORD}"></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

app.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.send(ui(`
        <div style="text-align:center; padding: 100px 0;">
            <img src="${ASSETS.LOGO}" style="width:300px; margin-bottom:30px;">
            <h1 style="font-size:48px; font-weight:900;">Dijital Taraftar Kartın Seni Bekliyor</h1>
            <p style="font-size:20px; color:#666; margin-bottom:40px;">Hemen Discord ile bağlan ve Roblox kimliğinle biletlerini yönetmeye baş.</p>
            <a href="${DISCORD_AUTH_URL}" class="btn-action" style="display:inline-block; width:auto; padding: 20px 40px; text-decoration:none; background:#5865F2;">
                <img src="${ASSETS.DISCORD}" style="height:24px; vertical-align:middle; margin-right:10px;"> Discord ile Giriş Yap
            </a>
        </div>
    `));
});

app.get('/login', (req, res) => res.redirect(DISCORD_AUTH_URL));

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const user = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenRes.data.access_token}` }
        });
        req.session.user = user.data;
        res.redirect('/dashboard');
    } catch (e) { res.redirect('/'); }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const user = req.session.user;
    const userCard = db_cards[user.id];

    if (!userCard) {
        res.send(ui(`
            <div class="hero-grid">
                <div class="glass-card">
                    <h2>Kart Başvurusu</h2>
                    <form action="/apply-card" method="POST">
                        <div class="form-group">
                            <label>Roblox Kullanıcı Adı</label>
                            <input type="text" name="roblox_name" placeholder="Örn: Xe1lea" required>
                        </div>
                        <div class="form-group">
                            <label>Roblox User ID</label>
                            <input type="text" name="roblox_id" placeholder="ID'nizi girin" required>
                            <a href="https://cdn.discordapp.com/attachments/1495543284423065662/1497935107258843247/image.png" target="_blank" style="font-size:12px; color:var(--primary); font-weight:700;">ID'mi Nasıl Bulurum?</a>
                        </div>
                        <div class="form-group">
                            <label>Discord Profil URL</label>
                            <input type="text" name="discord_url" placeholder="https://discord.com/users/..." required>
                            <a href="https://cdn.discordapp.com/attachments/1495543284423065662/1497935416429383801/image.png" target="_blank" style="font-size:12px; color:var(--primary); font-weight:700;">URL'mi Nasıl Alırım?</a>
                        </div>
                        <div class="form-group">
                            <label>Kart Tasarımı Seçin</label>
                            <select name="card_style">
                                <option value="RED">Klasik Kırmızı (Default)</option>
                                <option value="BLACK">Asil Siyah</option>
                                <option value="PATTERN">Özel Desenli</option>
                            </select>
                        </div>
                        <div style="background:#fff4f4; padding:15px; border-radius:10px; font-size:13px; color:#b00; margin-bottom:15px; border:1px solid #fcc;">
                            ⚠️ <b>Önemli Bilgi:</b> Roblox hesabınızı değiştirirseniz kartınız geçersiz sayılır. Bilgilerin doğruluğundan kullanıcı sorumludur.
                        </div>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                            <input type="checkbox" required style="width:auto;"> RoPasso Kullanım Şartlarını okudum, onaylıyorum.
                        </label>
                        <button class="btn-action">KARTIMI ÇIKART</button>
                    </form>
                </div>
                <div style="text-align:center;">
                    <img src="${ASSETS.LOGO}" style="width:100%; margin-bottom:20px; opacity:0.2;">
                    <h3>Hızlı Destek</h3>
                    <p style="font-size:14px; color:#666;">Bir sorun mu var? Discord sunucumuza gelerek yardım alabilirsin.</p>
                </div>
            </div>
        `, user));
    } else {
        const cardImg = CARDS[userCard.style];
        const headshot = `https://www.roblox.com/headshot-thumbnail/image?userId=${userCard.id}&width=420&height=420&format=png`;
        
        res.send(ui(`
            <div class="hero-grid">
                <div class="glass-card" style="text-align:center;">
                    <h2 style="margin-bottom:5px;">Kartlarım</h2>
                    <p style="margin-bottom:25px; font-size:14px; color:#666;">Aktif dijital kartınız aşağıdadır.</p>
                    
                    <div class="passo-card-preview" id="myCard" style="cursor:pointer;" onclick="alert('Kart Sahibi: ${userCard.name}\\nID: ${userCard.id}\\nDurum: Aktif')">
                        <img src="${cardImg}" class="card-bg">
                        <div class="card-user-info">
                            <img src="${headshot}" class="card-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
                            <div class="card-name">${userCard.name}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top:20px; font-size:14px; font-weight:700;">
                        KART DURUMU: <span style="color:#2e7d32;">AKTİF</span>
                    </div>
                </div>
                
                <div class="glass-card">
                    <h3>Bilet İşlemleri</h3>
                    <p style="font-size:14px;">Şu an aktif bir maç bulunmamaktadır. Yeni maçlar yüklendiğinde buradan bilet alabilirsin.</p>
                    <button class="btn-action" disabled>BİLETLERİMİ GÖR</button>
                    <button class="btn-action" style="background:#333; margin-top:10px;" onclick="location.href='/cancel-card'">KARTI İPTAL ET</button>
                </div>
            </div>
        `, user));
    }
});

app.post('/apply-card', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const { roblox_name, roblox_id, card_style } = req.body;
    db_cards[req.session.user.id] = {
        name: roblox_name,
        id: roblox_id,
        style: card_style
    };
    res.redirect('/dashboard');
});

app.get('/cancel-card', (req, res) => {
    if (req.session.user) delete db_cards[req.session.user.id];
    res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = app;

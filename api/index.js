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
    FAVICON: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAhFBMVEVHcEyKGCbuT13YO0uYESPFM0PiQ1JqGCEZBwmaCx+uHS+XCBvAKz2PCx7ZQU/tTFvJKj23Jjf+///rSFiwEynhPk+kCSC8HjLJKTzCJDjlQ1PbOEmqDSPklZzPMEG3Gi/ZJzzEFy+tAA3iq7DTXWnYf4f79PXAABnPOEjsw8by0NPz3uBXKbGSAAAAEnRSTlMAgN1fbK+sDCasr9/qt3Om0thp3sPkAAABNklEQVQokY3S2ZaDIAwAUJ261bEzrUbrgjuKbf///4YEcDm+TF48eg0hBMv6X1zcexTd3ctZfK9amibPi+L5DP2j/aTVhi04e/NSiZJ6GYgQ7qxE5DXGxAcGANd1zQSxe8c66gGA6ZX9ROFsMB4HYJna1a9Cbkj+tDCWqYUTwq7G79P0Uaksy6h3jVjyLxqB+EJ01KqEWHLsCzGbTFz3i1CV5EVPzwnxW2EpEUvGQnDaM7ANZWb3iuNjK3ucqYdYbQcMqg2Va9o8SQO9IWpFlRzHseYC5MEz3YpPiCU/goaCU8FMOj9Pou7SzBNTb3R8AfZC3eXNhllgRpZSyWW9CTLRNgN1ywnnnG8It+0quHKcXbfeoXZvlmVXhwtmW4cI3KXS2F6D08UNnPARRY/QPpH+Qcb+/Q+f7TEvUgAhvgAAAABJRU5ErkJggg==",
    LOGO: "https://www.passo.com.tr/assets/img/passo-logo-tr-TR.png",
    TUTORIAL_THUMB: "https://img.youtube.com/vi/vWzcBagVKdo/maxresdefault.jpg",
    MOURNING_RIBBON: "https://png.pngtree.com/png-clipart/20221006/ourmid/pngtree-black-ribbon-png-image_6288405.png",
    MARTYRS_IMAGE: "https://www.indyturk.com/sites/default/files/styles/1368x911/public/article/main_image/2026/03/03/1366790-2000421950.jpeg?itok=nkPqbSE9"
};

const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${BOT_ID}&permissions=8&scope=bot+applications.commands`;

// --- HABERLER ---
let db_news = [
    { id: 1, title: "15 ŞEHİT, 15 EVLAT.", content: "Milletimizin başı sağ olsun. Acımız taze, yasımız büyük.", date: "26.04.2026", type: "alert" },
    { id: 2, title: "RoPasso V2.5 Yayında", content: "Yeni nesil biletleme ve stadyum giriş sistemi tüm sunucular için optimize edildi.", date: "25.04.2026", type: "news" }
];

// --- ARAYÜZ ---
const ui = (body, user = null) => `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="${ASSETS.FAVICON}">
    <title>RoPasso | Dijital Biletleme Platformu</title>
    <style>
        :root { --primary: #e30613; --bg: #f8f9fa; --card-bg: #ffffff; --text: #1d1d1f; --gray: #86868b; }
        * { box-sizing: border-box; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif; }
        
        body { margin: 0; background: var(--bg); color: var(--text); overflow-x: hidden; }

        /* Yas Kurdelesi */
        .ribbon { position: fixed; top: 0; right: 50px; width: 60px; z-index: 2000; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1)); }

        /* Navbar */
        .navbar { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 10%; position: sticky; top: 0; z-index: 1000; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .logo-box img { height: 35px; transition: 0.3s; }
        .logo-box:hover img { transform: scale(1.05); }

        .nav-right { display: flex; align-items: center; gap: 20px; }
        .btn-main { background: var(--primary); color: white; padding: 10px 24px; border-radius: 20px; text-decoration: none; font-weight: 600; font-size: 14px; transition: 0.3s; border: none; cursor: pointer; }
        .btn-main:hover { background: #c20510; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(227,6,19,0.2); }
        
        /* Hero Section */
        .hero { text-align: center; padding: 80px 20px; background: white; border-bottom: 1px solid #eee; }
        .hero h1 { font-size: 56px; font-weight: 800; letter-spacing: -2px; margin: 0; color: #000; }
        .hero p { font-size: 20px; color: var(--gray); margin: 20px 0; }

        .container { max-width: 1100px; margin: 40px auto; padding: 0 20px; }

        /* Tutorial Card */
        .video-section { position: relative; border-radius: 30px; overflow: hidden; background: #000; box-shadow: 0 30px 60px rgba(0,0,0,0.15); margin-top: -50px; }
        .video-section img { width: 100%; opacity: 0.8; transition: 0.5s; cursor: pointer; }
        .video-section:hover img { transform: scale(1.02); opacity: 1; }
        .play-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--primary); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 30px; pointer-events: none; }

        /* Info Grid */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin: 60px 0; }
        .info-card { background: white; padding: 40px; border-radius: 24px; border: 1px solid #eee; transition: 0.3s; }
        .info-card:hover { border-color: var(--primary); }
        .info-card h3 { margin-top: 0; font-size: 24px; }
        
        /* Music Control */
        #music-player { position: fixed; bottom: 30px; left: 30px; z-index: 1000; background: white; padding: 12px 20px; border-radius: 50px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #eee; cursor: pointer; }
        .music-bar { width: 3px; height: 15px; background: var(--primary); animation: pulse 1s infinite ease-in-out; display: none; }
        @keyframes pulse { 0%, 100% { height: 5px; } 50% { height: 20px; } }

        /* News Section */
        .news-item { border-left: 4px solid var(--primary); padding: 20px; background: white; margin-bottom: 15px; border-radius: 0 15px 15px 0; }
        .alert-item { background: #fff5f5; border-left-color: black; }

        @keyframes shine { 0% { left: -100%; } 100% { left: 150%; } }
        .logo-shine { position: relative; overflow: hidden; }
        .logo-shine::after { content: ""; position: absolute; top: 0; left: -100%; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); transform: skewX(-20deg); animation: shine 3s infinite; }

    </style>
</head>
<body>
    <img src="${ASSETS.MOURNING_RIBBON}" class="ribbon">

    <div id="music-player" onclick="handleMusic()">
        <div class="music-bar" id="b1"></div>
        <div class="music-bar" id="b2" style="animation-delay: 0.2s"></div>
        <div class="music-bar" id="b3" style="animation-delay: 0.4s"></div>
        <span id="m-text" style="font-weight: 600; font-size: 14px;">Müziği Başlat</span>
    </div>
    <div id="yt-wrap" style="display:none">
        <div id="player"></div>
    </div>

    <div class="navbar">
        <div class="logo-box logo-shine" onclick="location.href='/'">
            <img src="${ASSETS.LOGO}">
        </div>
        <div class="nav-right">
            <a href="/login" style="color: var(--gray); text-decoration: none; font-weight: 500;">Giriş Yap</a>
            <a href="${BOT_INVITE_URL}" class="btn-main">BOTU EKLE</a>
        </div>
    </div>

    <div class="hero">
        <h1>RoPasso Bot</h1>
        <p>Discord sunucunuzun dijital stadyum yönetim sistemi.</p>
        <div style="display:flex; justify-content:center; gap:15px;">
            <div style="background: #f2f2f7; padding: 10px 20px; border-radius: 30px; font-weight: 600;">#1 Biletleme Sistemi</div>
            <div style="background: #f2f2f7; padding: 10px 20px; border-radius: 30px; font-weight: 600;">%100 Güvenli</div>
        </div>
    </div>

    <div class="container">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="font-size: 32px; letter-spacing: -1px;">Nasıl Kullanılır?</h2>
        </div>
        <div class="video-section" onclick="window.open('https://www.youtube.com/watch?v=vWzcBagVKdo', '_blank')">
            <img src="${ASSETS.TUTORIAL_THUMB}">
            <div class="play-btn">▶</div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <h3 style="color: var(--primary);">01. Kurulum</h3>
                <p>Botu sunucunuza ekleyin ve /kurulum komutuyla saniyeler içinde stadyumunuzu oluşturun.</p>
            </div>
            <div class="info-card">
                <h3 style="color: var(--primary);">02. Biletleme</h3>
                <p>Üyeleriniz biletlerini alsın, rollerini kapsın. Maç günleri otomatik kapı kontrolleri başlasın.</p>
            </div>
            <div class="info-card">
                <h3 style="color: var(--primary);">03. Yönetim</h3>
                <p>Panel üzerinden tüm bilet satışlarını, tribün doluluk oranlarını ve gelirleri anlık takip edin.</p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-top: 60px;">
            <div>
                <h2 style="font-size: 28px;">Neden RoPasso?</h2>
                <p style="color: var(--gray); line-height: 1.6;">RoPasso, Türkiye'nin ilk ve tek profesyonel Discord stadyum giriş sistemidir. Gerçek Passo deneyimini sunucunuza taşır. Karmaşık kodlarla uğraşmanıza gerek kalmaz, her şey otomatikleşir.</p>
                <img src="${ASSETS.MARTYRS_IMAGE}" style="width: 100%; border-radius: 20px; margin-top: 20px; grayscale: 1; opacity: 0.7;">
            </div>
            <div>
                <h2 style="font-size: 28px;">📢 Duyurular</h2>
                <div id="news-list">
                    ${db_news.map(n => `
                        <div class="news-item ${n.type === 'alert' ? 'alert-item' : ''}">
                            <small style="font-weight: 700; color: ${n.type === 'alert' ? '#000' : 'var(--primary)'}">${n.date}</small>
                            <h4 style="margin: 8px 0;">${n.title}</h4>
                            <p style="font-size: 14px; margin: 0; color: #555;">${n.content}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>

    <script src="https://www.youtube.com/iframe_api"></script>
    <script>
        let player;
        let isPlaying = false;

        function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
                height: '0', width: '0',
                videoId: 'z6YcXEAjc_o',
                playerVars: { 'autoplay': 0, 'loop': 1, 'playlist': 'z6YcXEAjc_o' }
            });
        }

        function handleMusic() {
            const bars = document.querySelectorAll('.music-bar');
            const txt = document.getElementById('m-text');
            if(!isPlaying) {
                player.playVideo();
                player.setVolume(20);
                bars.forEach(b => b.style.display = 'block');
                txt.innerText = "Müziği Durdur";
                isPlaying = true;
            } else {
                player.pauseVideo();
                bars.forEach(b => b.style.display = 'none');
                txt.innerText = "Müziği Başlat";
                isPlaying = false;
            }
        }
    </script>
</body>
</html>`;

// --- ROUTES ---
app.get('/', (req, res) => {
    res.send(ui("", req.session.user));
});

app.get('/login', (req, res) => res.send("Giriş Sistemi Yakında..."));

app.listen(3000, () => console.log("RoPasso Hub 3000 portunda aktif!"));

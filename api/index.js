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
const BOT_TOKEN = process.env.BOT_TOKEN; 
const ASSETS = {
    FAVICON: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAMAAABF0y+mAAAAhFBMVEVHcEyKGCbuT13YO0uYESPFM0PiQ1JqGCEZBwmaCx+uHS+XCBvAKz2PCx7ZQU/tTFvJKj23Jjf+///rSFiwEynhPk+kCSC8HjLJKTzCJDjlQ1PbOEmqDSPklZzPMEG3Gi/ZJzzEFy+tAA3iq7DTXWnYf4f79PXAABnPOEjsw8by0NPz3uBXKbGSAAAAEnRSTlMAgN1fbK+sDCasr9/qt3Om0thp3sPkAAABNklEQVQokY3S2ZaDIAwAUJ261bEzrUbrgjuKbf///4YEcDm+TF48eg0hBMv6X1zcexTd3ctZfK9amibPi+L5DP2j/aTVhi04e/NSiZJ6GYgQ7qxE5DXGxAcGANd1zQSxe8c66gGA6ZX9ROFsMB4HYJna1a9Cbkj+tDCWqYUTwq7G79P0Uaksy6h3jVjyLXqB+EJ01KqEWHLsCzGbTFz3i1CV5EVPzwnxW2EpEUvGQnDaM7ANZWb3iuNjK3ucqYdYbQcMqg2Va9o8SQO9IWpFlRzHseYC5MEz3YpPiCU/goaCU8FMOj9Pou7SzBNTb3R8AfZC3eXNhllgRpZSyWW9CTLRNgN1ywnnnG8It+0quHKcXbfeoXZvlmVXhwtmW4cI3KXS2F6D08UNnPARRY/QPpH+Qcb+/Q+f7TEvUgAhvgAAAABJRU5ErkJggg==",
    LOGO: "https://cdn.discordapp.com/attachments/1495543284423065662/1497923776929599570/Gemini_Generated_Image_o1s4jao1s4jao1s4-removebg-preview.png",
    NEWS_BANNER: "https://cdn.discordapp.com/attachments/1495543284423065662/1497937018355712111/image.png",
    MOURNING_RIBBON: "https://png.pngtree.com/png-clipart/20221006/ourmid/pngtree-black-ribbon-png-image_6288405.png",
    MARTYRS_IMAGE: "https://www.indyturk.com/sites/default/files/styles/1368x911/public/article/main_image/2026/03/03/1366790-2000421950.jpeg?itok=nkPqbSE9",
    OFFICIAL_DISCORD: "https://discord.gg/hsWrzs4FJE"
};

const BOT_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${BOT_ID}&permissions=8&scope=bot+applications.commands`;

// --- HABER YÖNETİMİ (Buradan kolayca ekleyebilirsin) ---
let db_news = [
    { 
        id: 1, 
        title: "BAŞIMIZ SAĞ OLSUN", 
        content: "15 evladımızı şehit verdik. Unutmayacağız, unutturmayacağız.", 
        date: "26.04.2026", 
        isAlert: true 
    },
    { 
        id: 2, 
        title: "Passolig Sistemi Aktif", 
        content: "Dijital biletleme altyapısı RoPasso ile tüm sunucularda yayında.", 
        date: "25.04.2026", 
        isAlert: false 
    }
];

// --- BOTUN SUNUCULARINI ÇEKEN FONKSİYON ---
async function getBotGuilds() {
    if(!BOT_TOKEN) return [];
    try {
        const response = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bot ${BOT_TOKEN}` }
        });
        return response.data;
    } catch (e) { return []; }
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
        :root { --primary: #e30613; --bg: #050505; --card: #111; --text: #ffffff; --yas: #000000; }
        * { box-sizing: border-box; font-family: 'SF Pro Display', sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--text); overflow-x: hidden; }

        /* Arka Plan Yas Modu */
        .mourning-overlay { position: fixed; top: 20px; right: 20px; width: 80px; z-index: 9999; pointer-events: none; opacity: 0.8; }
        
        .navbar { background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); height: 80px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; position: sticky; top: 0; z-index: 1000; border-bottom: 2px solid var(--primary); }
        
        /* Logo Shine Animasyonu */
        .logo-container { position: relative; overflow: hidden; display: flex; align-items: center; cursor: pointer; }
        .logo-container img { height: 50px; position: relative; z-index: 2; }
        .logo-container::after { content: ""; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-25deg); transition: 0.5s; }
        .logo-container:hover::after { animation: shine 0.8s forwards; }

        @keyframes shine { 100% { left: 150%; } }

        .container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
        
        /* Şehitler Anısı Bölümü */
        .martyr-section { background: url('${ASSETS.MARTYRS_IMAGE}') center/cover; height: 300px; border-radius: 20px; margin-bottom: 30px; position: relative; border: 1px solid #333; grayscale: 100%; }
        .martyr-overlay { position: absolute; inset:0; background: linear-gradient(transparent, black); border-radius: 20px; display: flex; align-items: flex-end; padding: 30px; }

        .glass-card { background: var(--card); border-radius: 20px; padding: 25px; border: 1px solid #222; margin-bottom: 25px; transition: 0.3s; }
        .nav-btn { background: var(--primary); color: #fff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; transition: 0.3s; border: none; cursor: pointer; }
        .nav-btn:hover { background: #fff; color: #000; }

        .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .server-card { background: #181818; border-radius: 15px; padding: 15px; display: flex; align-items: center; gap: 15px; border-left: 4px solid var(--primary); text-decoration: none; color: inherit; transition: 0.3s; }
        .server-card:hover { background: #222; transform: translateX(5px); }
        .server-icon { width: 50px; height: 50px; border-radius: 50%; border: 2px solid #333; }

        #music-control { position: fixed; bottom: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 30px; border: 1px solid #444; z-index: 1000; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 12px; }
    </style>
</head>
<body>
    <img src="${ASSETS.MOURNING_RIBBON}" class="mourning-overlay">
    
    <div id="music-control" onclick="toggleMusic()">
        <span id="music-icon">🔇</span> <span id="music-text">Müziği Aç</span>
    </div>
    <iframe id="bg-music" width="0" height="0" src="https://www.youtube.com/embed/z6YcXEAjc_o?enablejsapi=1&autoplay=0" frameborder="0" style="display:none;"></iframe>

    <div class="navbar">
        <div class="logo-container" onclick="location.href='/'">
            <img src="${ASSETS.LOGO}">
        </div>
        <div style="display:flex; gap:15px; align-items:center;">
            <a href="${ASSETS.OFFICIAL_DISCORD}" target="_blank" class="nav-btn" style="background:#5865F2;">DISCORD</a>
            <a href="${BOT_INVITE_URL}" target="_blank" class="nav-btn">BOTU EKLE</a>
            ${user ? `<b style="font-size:14px;">${user.username}</b>` : `<a href="/login" style="color:#aaa; text-decoration:none;">Giriş</a>`}
        </div>
    </div>

    <div class="container">
        <div class="martyr-section">
            <div class="martyr-overlay">
                <div>
                    <h2 style="margin:0; color:white;">15 FİDAN, 15 ŞEHİT.</h2>
                    <p style="color:#ccc; margin-top:5px;">Milletimizin başı sağ olsun. Acımız sonsuz.</p>
                </div>
            </div>
        </div>

        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:30px;">
            <div>
                <h3 style="border-left: 5px solid var(--primary); padding-left:15px;">Aktif Sunucular</h3>
                <div class="server-grid" id="serverList">
                    ${body} 
                </div>
            </div>
            
            <div>
                <h3>📢 Haberler & Güncel</h3>
                <div id="news-container">
                    </div>
            </div>
        </div>
    </div>

    <script>
        let musicPlaying = false;
        const player = document.getElementById('bg-music');
        
        function toggleMusic() {
            const icon = document.getElementById('music-icon');
            const text = document.getElementById('music-text');
            if(!musicPlaying) {
                player.src += "&autoplay=1";
                icon.innerText = "🔊"; text.innerText = "Müziği Kapat";
                musicPlaying = true;
            } else {
                player.src = player.src.replace("&autoplay=1", "");
                icon.innerText = "🔇"; text.innerText = "Müziği Aç";
                musicPlaying = false;
            }
        }

        // Haberleri Doldur
        const news = ${JSON.stringify(db_news)};
        const newsHtml = news.map(n => \`
            <div class="glass-card" style="\${n.isAlert ? 'border-color: #555;' : ''}">
                <small style="color:var(--primary)">\${n.date}</small>
                <h4 style="margin:10px 0;">\${n.title}</h4>
                <p style="font-size:13px; color:#999; margin:0;">\${n.content}</p>
            </div>
        \`).join('');
        document.getElementById('news-container').innerHTML = newsHtml;
    </script>
</body>
</html>`;

// --- ROUTES ---
app.get('/', async (req, res) => {
    const guilds = await getBotGuilds();
    let serversHtml = guilds.length > 0 ? guilds.map(s => `
        <a href="#" class="server-card">
            <img src="https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png" class="server-icon" onerror="this.src='https://ui-avatars.com/api/?name=${s.name}&background=333&color=fff'">
            <div>
                <div style="font-weight:bold;">${s.name}</div>
                <div style="font-size:11px; color:green;">SİSTEM AKTİF</div>
            </div>
        </a>
    `).join('') : '<p style="color:#444;">Sunucu bulunamadı.</p>';

    res.send(ui(serversHtml, req.session.user));
});

app.get('/login', (req, res) => res.redirect(DISCORD_AUTH_URL)); // Discord Auth linkini buraya bağla
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

module.exports = app;

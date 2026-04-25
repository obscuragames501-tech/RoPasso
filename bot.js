// Vercel üzerindeki Environment Variables'dan (Key) bilgileri çeker
const { 
    Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits, ActivityType,
    ChannelType
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- AYARLAR ---
// Vercel panelinde "DISCORD_TOKEN" ismiyle açtığın keyi buradan okur
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";

// --- KOMUT TANIMLAMALARI ---
const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('RoPasso Kontrol Panelini bu kanala kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('setmatch')
        .setDescription('Yeni bir maç etkinliği planlar.'),
    new SlashCommandBuilder()
        .setName('setconcert')
        .setDescription('Yeni bir konser etkinliği planlar.'),
    new SlashCommandBuilder()
        .setName('adminduzenle')
        .setDescription('Etkinlik yönetici rollerini ayarlar.'),
    new SlashCommandBuilder()
        .setName('passoyardim')
        .setDescription('Tüm komutların listesini ve kullanımını gösterir.')
];

// --- BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    console.log(`✅ ROPasso Hazır: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    try {
        await client.application.commands.set(commands);
        console.log("🔥 Global slash komutları başarıyla tanımlandı.");
    } catch (err) {
        console.error("❌ Komut yükleme hatası:", err);
    }
});

// --- SUNUCUYA KATILMA OLAYI ---
client.on('guildCreate', async (guild) => {
    const channel = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && 
        ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
    );

    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🏟️ RoPasso Sunucunuza Hoş Geldiniz!')
        .setDescription('Premium biletleme altyapısı hazır. Başlamak için paneli kurun.')
        .setColor(PASSO_RED)
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: 'RoPasso | Premium System' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('auto_setup')
            .setLabel('Yönetim Panelini Kur')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🛠️')
    );

    channel.send({ embeds: [welcomeEmbed], components: [row] });
});

// --- ETKİLEŞİM YÖNETİMİ ---
client.on('interactionCreate', async interaction => {
    
    // 1. SLASH KOMUTLARI
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') await sendControlPanel(interaction);
        
        if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
            await openEventModal(interaction, interaction.commandName === 'setmatch');
        }

        if (interaction.commandName === 'passoyardim') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('📖 ROPasso Komut Rehberi')
                .setColor(PASSO_RED)
                .addFields(
                    { name: '`/setup`', value: 'Yönetim panelini kanala gönderir.' },
                    { name: '`/setmatch`', value: 'Maç oluşturma formunu açar.' },
                    { name: '`/setconcert`', value: 'Konser oluşturma formunu açar.' }
                );
            await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
        }
    }

    // 2. BUTONLAR
    if (interaction.isButton()) {
        if (interaction.customId === 'auto_setup' || interaction.customId === 'refresh_panel') {
            await sendControlPanel(interaction);
        }

        if (interaction.customId === 'btn_match') await openEventModal(interaction, true);
        if (interaction.customId === 'btn_concert') await openEventModal(interaction, false);
        
        if (interaction.customId === 'add_tribune') {
            const modal = new ModalBuilder().setCustomId('modal_tribune').setTitle('Tribün Detayları');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_name').setLabel("Tribün Adı").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_part').setLabel("Roblox Part İsmi").setStyle(TextInputStyle.Short).setRequired(true))
            );
            await interaction.showModal(modal);
        }
    }

    // 3. MODAL SUBMIT (FORM GÖNDERME)
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_match' || interaction.customId === 'modal_concert') {
            const isMatch = interaction.customId === 'modal_match';
            const title = interaction.fields.getTextInputValue('title');
            const date = interaction.fields.getTextInputValue('date');
            
            const eventEmbed = new EmbedBuilder()
                .setTitle(isMatch ? `⚽ Maç Kuruluyor: ${title}` : `🎤 Konser Kuruluyor: ${title}`)
                .setColor(isMatch ? '#1F1F1F' : '#FFB300')
                .setDescription(`Etkinlik detayları sisteme işlendi.`)
                .addFields(
                    { name: '📅 Tarih', value: date, inline: true },
                    { name: '🏟️ Durum', value: 'Tribün Bekleniyor', inline: true }
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('add_tribune').setLabel('➕ Tribün Ekle').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('finalize').setLabel('🚀 Yayına Al').setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ embeds: [eventEmbed], components: [row] });
        }

        if (interaction.customId === 'modal_tribune') {
            const tName = interaction.fields.getTextInputValue('t_name');
            await interaction.reply({ content: `✅ **${tName}** tribünü başarıyla kaydedildi.`, ephemeral: true });
        }
    }
});

// --- YARDIMCI FONKSİYONLAR ---
async function sendControlPanel(interaction) {
    const panelEmbed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Yönetim Paneli')
        .setDescription('Sunucundaki maç ve konser süreçlerini buradan yönetebilirsin.')
        .setThumbnail(client.user.displayAvatarURL())
        .setColor(PASSO_RED);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_match').setLabel('Maç Kur').setStyle(ButtonStyle.Secondary).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('btn_concert').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤'),
        new ButtonBuilder().setCustomId('refresh_panel').setLabel('Paneli Yenile').setStyle(ButtonStyle.Primary).setEmoji('🔄')
    );

    if (interaction.isButton()) {
        await interaction.update({ embeds: [panelEmbed], components: [row] });
    } else {
        await interaction.reply({ embeds: [panelEmbed], components: [row] });
    }
}

async function openEventModal(interaction, isMatch) {
    const modal = new ModalBuilder()
        .setCustomId(isMatch ? 'modal_match' : 'modal_concert')
        .setTitle(isMatch ? 'Maç Oluşturma' : 'Konser Oluşturma');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel(isMatch ? "Maç Adı" : "Etkinlik Adı").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Tarih (GG/AA/YYYY Saat)").setStyle(TextInputStyle.Short).setPlaceholder("26/04/2026 20:30").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel("Roblox Oyun Linki").setStyle(TextInputStyle.Short).setRequired(true))
    );

    await interaction.showModal(modal);
}

// Botu başlat
if (TOKEN) {
    client.login(TOKEN);
} else {
    console.error("❌ HATA: Vercel üzerinde DISCORD_TOKEN anahtarı (key) bulunamadı!");
}

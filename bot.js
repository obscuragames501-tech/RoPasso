const { 
    Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits, ActivityType,
    ChannelType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- AYARLAR ---
const TOKEN = process.env.DISCORD_TOKEN; 
const GUILD_ID = "SUNUCU_ID_BURAYA"; // <--- BURAYA KENDİ SUNUCUNUN ID'SİNİ YAZ!
const PASSO_RED = "#E30613";

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
].map(command => command.toJSON());

// --- KOMUTLARI KAYDETME FONKSİYONU ---
async function refreshCommands() {
    if (!TOKEN) return console.error("❌ TOKEN BULUNAMADI!");
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('🔄 Slash komutları SUNUCUYA özel olarak yenileniyor...');
        
        // applicationGuildCommands kullanarak komutların anında (0 saniye) gelmesini sağlıyoruz
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, GUILD_ID),
            { body: commands },
        );
        
        console.log('✅ Komutlar bu sunucu için ANINDA aktif edildi!');
    } catch (error) {
        console.error('❌ Komut kaydetme hatası:', error);
    }
}

// --- BOT HAZIR ---
client.once('ready', async () => {
    console.log(`✅ ROPasso Hazır: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });
    
    // Bot açıldığında ID kontrolü yapıp komutları basıyoruz
    await refreshCommands();
});

// --- SUNUCUYA KATILINCA HOŞ GELDİN MESAJI ---
client.on('guildCreate', async (guild) => {
    const channel = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && 
        ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
    );

    if (!channel) return;

    const welcome = new EmbedBuilder()
        .setTitle('🏟️ RoPasso | Sisteme Hoş Geldiniz!')
        .setDescription('Premium stadyum yönetim sistemi hazır! Komutlar gelmediyse **Ctrl + R** yapın.')
        .addFields({ name: '🚀 Başlangıç', value: '`/setup` yazarak yönetim panelini açabilirsin.' })
        .setColor(PASSO_RED)
        .setFooter({ text: 'ROPasso Dashboard System' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('auto_setup').setLabel('Paneli Kur').setStyle(ButtonStyle.Danger).setEmoji('🛠️')
    );

    channel.send({ embeds: [welcome], components: [row] }).catch(() => null);
});

// --- ETKİLEŞİMLER (KOMUTLAR & BUTONLAR) ---
client.on('interactionCreate', async interaction => {
    
    // 1. SLASH KOMUTLARINI YÖNET
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') await sendControlPanel(interaction);
        
        if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
            await openEventModal(interaction, interaction.commandName === 'setmatch');
        }

        if (interaction.commandName === 'passoyardim') {
            const help = new EmbedBuilder()
                .setTitle('📖 RoPasso Kullanım Rehberi')
                .addFields(
                    { name: '`/setup`', value: 'Yönetici panelini kurar.' },
                    { name: '`/setmatch`', value: 'Maç oluşturma formunu açar.' },
                    { name: '`/setconcert`', value: 'Konser oluşturma formunu açar.' }
                )
                .setColor(PASSO_RED);
            await interaction.reply({ embeds: [help], ephemeral: true });
        }
    }

    // 2. BUTONLARI YÖNET
    if (interaction.isButton()) {
        if (interaction.customId === 'auto_setup' || interaction.customId === 'refresh_panel') {
            await sendControlPanel(interaction);
        }
        if (interaction.customId === 'btn_match') await openEventModal(interaction, true);
        if (interaction.customId === 'btn_concert') await openEventModal(interaction, false);
    }

    // 3. MODAL (FORM) SUBMIT YÖNET
    if (interaction.isModalSubmit()) {
        const title = interaction.fields.getTextInputValue('title');
        const date = interaction.fields.getTextInputValue('date');
        
        await interaction.reply({ 
            content: `✅ **${title}** etkinliği başarıyla sisteme işlendi! Tarih: **${date}**`, 
            ephemeral: true 
        });
    }
});

// --- PANEL GÖNDERME FONKSİYONU ---
async function sendControlPanel(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Yönetim Paneli')
        .setDescription('Aşağıdaki butonları kullanarak sunucu etkinliklerini düzenleyebilirsin.')
        .setColor(PASSO_RED)
        .setThumbnail(client.user.displayAvatarURL());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_match').setLabel('Maç Kur').setStyle(ButtonStyle.Secondary).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('btn_concert').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤'),
        new ButtonBuilder().setCustomId('refresh_panel').setLabel('Yenile').setStyle(ButtonStyle.Primary).setEmoji('🔄')
    );

    if (interaction.isButton()) {
        await interaction.update({ embeds: [embed], components: [row] });
    } else {
        await interaction.reply({ embeds: [embed], components: [row] });
    }
}

// --- MODAL AÇMA FONKSİYONU ---
async function openEventModal(interaction, isMatch) {
    const modal = new ModalBuilder()
        .setCustomId(isMatch ? 'modal_match' : 'modal_concert')
        .setTitle(isMatch ? 'Yeni Maç Oluştur' : 'Yeni Konser Oluştur');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel(isMatch ? "Maç Adı" : "Etkinlik Adı").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Tarih ve Saat").setStyle(TextInputStyle.Short).setPlaceholder("Örn: 26/04 20:30").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel("Roblox Oyun Linki").setStyle(TextInputStyle.Short).setRequired(true))
    );

    await interaction.showModal(modal);
}

// BOTU ATEŞLE
if (TOKEN) {
    client.login(TOKEN);
} else {
    console.error("❌ HATA: Vercel üzerinde DISCORD_TOKEN bulunamadı!");
}

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
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('🔄 Slash komutları yenileniyor...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ Slash komutları başarıyla küresel olarak kaydedildi!');
    } catch (error) {
        console.error('❌ Komut kaydetme hatası:', error);
    }
}

// --- BOT HAZIR ---
client.once('ready', async () => {
    console.log(`✅ ROPasso Hazır: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });
    
    // Bot açıldığında komutları Discord'a zorla kaydettiriyoruz
    await refreshCommands();
});

// --- SUNUCUYA KATILINCA MESAJ ---
client.on('guildCreate', async (guild) => {
    console.log(`🏠 Yeni Sunucu: ${guild.name}`);
    
    // Botun mesaj yazabileceği en yetkili kanalı bul
    const channel = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && 
        ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
    );

    if (!channel) return;

    const welcome = new EmbedBuilder()
        .setTitle('🏟️ RoPasso | Sisteme Hoş Geldiniz!')
        .setDescription('Roblox biletleme ve stadyum yönetim sistemi başarıyla sunucunuza eklendi.\n\n**Komutlar gözükmüyorsa Discord uygulamanızı kapatıp açın (Ctrl+R).**')
        .addFields({ name: '🚀 Başlangıç', value: '`/setup` yazarak paneli kurabilirsin.' })
        .setColor(PASSO_RED)
        .setThumbnail(client.user.displayAvatarURL());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('auto_setup').setLabel('Paneli Kur').setStyle(ButtonStyle.Danger).setEmoji('🛠️')
    );

    channel.send({ embeds: [welcome], components: [row] }).catch(e => console.log("Mesaj atılamadı:", e));
});

// --- ETKİLEŞİMLER ---
client.on('interactionCreate', async interaction => {
    
    // Slash Komut İşleme
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') await sendControlPanel(interaction);
        if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
            await openEventModal(interaction, interaction.commandName === 'setmatch');
        }
        if (interaction.commandName === 'passoyardim') {
            const help = new EmbedBuilder()
                .setTitle('📖 Komut Listesi')
                .addFields(
                    { name: '/setup', value: 'Paneli kurar.' },
                    { name: '/setmatch', value: 'Maç açar.' }
                ).setColor(PASSO_RED);
            await interaction.reply({ embeds: [help], ephemeral: true });
        }
    }

    // Buton İşleme
    if (interaction.isButton()) {
        if (interaction.customId === 'auto_setup' || interaction.customId === 'refresh_panel') {
            await sendControlPanel(interaction);
        }
        if (interaction.customId === 'btn_match') await openEventModal(interaction, true);
        if (interaction.customId === 'btn_concert') await openEventModal(interaction, false);
    }

    // Modal (Form) İşleme
    if (interaction.isModalSubmit()) {
        const title = interaction.fields.getTextInputValue('title');
        await interaction.reply({ content: `✅ Etkinlik başarıyla oluşturuldu: **${title}**`, ephemeral: true });
    }
});

async function sendControlPanel(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Yönetim Paneli')
        .setDescription('Etkinlikleri buradan yönetin.')
        .setColor(PASSO_RED);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_match').setLabel('Maç Kur').setStyle(ButtonStyle.Secondary).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('btn_concert').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
    );

    if (interaction.isButton()) await interaction.update({ embeds: [embed], components: [row] });
    else await interaction.reply({ embeds: [embed], components: [row] });
}

async function openEventModal(interaction, isMatch) {
    const modal = new ModalBuilder()
        .setCustomId(isMatch ? 'modal_match' : 'modal_concert')
        .setTitle(isMatch ? 'Maç Kur' : 'Konser Kur');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel("Başlık").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Tarih").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel("Oyun Linki").setStyle(TextInputStyle.Short).setRequired(true))
    );

    await interaction.showModal(modal);
}

if (TOKEN) client.login(TOKEN);
else console.error("❌ TOKEN YOK!");

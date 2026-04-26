const { 
    Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits, ActivityType,
    ChannelType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- 1. WEB SERVER (7/24 AKTİF TUTAR) ---
const app = express();
app.get('/', (req, res) => res.send('ROPasso Bot 7/24 Online!'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Web sunucusu aktif.'));

// --- 2. BOT AYARLARI ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// BURAYI OTOMATİK DOLDURDUM - DOKUNMA
const CLIENT_ID = "1497727912978153482"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";

// --- 3. KOMUTLAR ---
const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('RoPasso Kontrol Panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('setmatch')
        .setDescription('Maç etkinliği planlar.'),
    new SlashCommandBuilder()
        .setName('setconcert')
        .setDescription('Konser etkinliği planlar.'),
    new SlashCommandBuilder()
        .setName('yardim')
        .setDescription('Komut listesini gösterir.')
].map(command => command.toJSON());

// --- 4. KOMUT YÜKLEME MOTORU ---
async function deployCommands(guildId) {
    if (!TOKEN) return console.error("❌ HATA: DISCORD_TOKEN Vercel panelinde ekli değil!");
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        // applicationGuildCommands kullanarak komutların ANINDA gelmesini sağlıyoruz
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guildId),
            { body: commands },
        );
        console.log(`✅ Komutlar Sunucuya Basıldı: ${guildId}`);
    } catch (error) {
        console.error(`❌ Yetki Hatası (${guildId}): Botu sunucuya eklerken 'applications.commands' seçilmemiş olabilir.`);
    }
}

// --- 5. BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    console.log(`🤖 Bot Giriş Yaptı: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    // Mevcut tüm sunuculara komutları yükle
    client.guilds.cache.forEach(guild => {
        deployCommands(guild.id);
    });
});

// --- 6. YENİ SUNUCUYA KATILINCA ---
client.on('guildCreate', async (guild) => {
    console.log(`🏠 Yeni sunucu algılandı: ${guild.name}`);
    await deployCommands(guild.id);
});

// --- 7. ETKİLEŞİMLER (SLASH, BUTON, MODAL) ---
client.on('interactionCreate', async interaction => {
    
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') {
            const embed = new EmbedBuilder()
                .setTitle('🕹️ ROPasso Yönetim Paneli')
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription('Sunucudaki biletleme ve etkinlik işlemlerini aşağıdaki butonlarla yönetebilirsiniz.')
                .setColor(PASSO_RED)
                .setFooter({ text: 'ROPasso Dijital Geçiş Sistemi' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_match').setLabel('Maç Kur').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
                new ButtonBuilder().setCustomId('btn_concert').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
        
        if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
            await showEventModal(interaction, interaction.commandName === 'setmatch');
        }

        if (interaction.commandName === 'yardim') {
            await interaction.reply({ content: "📖 **Komutlar:**\n`/setup` - Paneli kurar\n`/setmatch` - Maç oluşturur\n`/setconcert` - Konser oluşturur", ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'btn_match') await showEventModal(interaction, true);
        if (interaction.customId === 'btn_concert') await showEventModal(interaction, false);
    }

    if (interaction.isModalSubmit()) {
        const title = interaction.fields.getTextInputValue('title');
        const date = interaction.fields.getTextInputValue('date');
        
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Etkinlik Oluşturuldu')
            .setDescription(`**Etkinlik:** ${title}\n**Tarih:** ${date}\n\nSistem bilet satışlarını bu sunucu için aktif etti.`)
            .setColor('#28a745');

        await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    }
});

async function showEventModal(interaction, isMatch) {
    const modal = new ModalBuilder()
        .setCustomId(isMatch ? 'm_match' : 'm_concert')
        .setTitle(isMatch ? '⚽ Maç Planla' : '🎤 Konser Planla');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel("Etkinlik Başlığı").setPlaceholder("Örn: Ankaragücü - Galatasaray").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Tarih ve Saat").setPlaceholder("Örn: 28 Nisan 20:00").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel("Roblox Oyun Linki").setPlaceholder("https://roblox.com/...").setStyle(TextInputStyle.Short).setRequired(true))
    );

    await interaction.showModal(modal);
}

// BOTU BAŞLAT
if (TOKEN) {
    client.login(TOKEN).catch(err => console.error("❌ TOKEN HATALI: Bot giriş yapamadı!"));
} else {
    console.error("❌ HATA: Environment Variables kısmında 'DISCORD_TOKEN' bulunamadı!");
}

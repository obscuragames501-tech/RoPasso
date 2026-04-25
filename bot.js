const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Ayarların tutulacağı geçici obje (İleride MongoDB'ye bağlanacak)
let guildSettings = {};

client.once('ready', async () => {
    console.log(`✅ ROPasso Sistemi Aktif: ${client.user.tag}`);
    
    // Komutları Kaydetme
    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('RoPasso sistemini sunucu için aktif eder.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
        new SlashCommandBuilder()
            .setName('setmatch')
            .setDescription('Yeni bir maç etkinliği oluşturur.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

        new SlashCommandBuilder()
            .setName('setconcert')
            .setDescription('Yeni bir konser etkinliği oluşturur.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),

        new SlashCommandBuilder()
            .setName('adminduzenle')
            .setDescription('Yetkili rollerini günceller.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    ];

    await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {
    // Yönetici Yetki Kontrolü (Botun yetkisi var mı?)
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "❌ **Hata:** Botun 'Yönetici' yetkisi yok. Lütfen yetki verip tekrar deneyin.", ephemeral: true });
    }

    // --- SETUP KOMUTU ---
    if (interaction.commandName === 'setup') {
        const setupEmbed = new EmbedBuilder()
            .setTitle('🎫 RoPasso Kurulum Paneli')
            .setDescription('Sunucunuz için RoPasso artık aktif!\n\n**Admin Rolleri:** Lütfen etkinlik düzenleyebilecek rolleri aşağıdan belirtin.\nArtık `/adminduzenle` komutuyla yetkileri yönetebilirsiniz.')
            .setColor('#E30613')
            .setFooter({ text: 'Premium Passolig Deneyimi' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('setup_roles')
                .setLabel('Yetkili Rolleri Ayarla')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [setupEmbed], components: [row] });
    }

    // --- SETMATCH / SETCONCERT MODAL SİSTEMİ ---
    if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
        const isMatch = interaction.commandName === 'setmatch';
        
        const modal = new ModalBuilder()
            .setCustomId(isMatch ? 'match_modal' : 'concert_modal')
            .setTitle(isMatch ? 'Yeni Maç Oluştur' : 'Yeni Konser Oluştur');

        const titleInput = new TextInputBuilder()
            .setCustomId('event_title')
            .setLabel(isMatch ? "Maç Adı (Örn: FB - GS)" : "Sanatçı Adı")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const linkInput = new TextInputBuilder()
            .setCustomId('roblox_link')
            .setLabel("Roblox Stadyum/Mekan Linki")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("https://www.roblox.com/games/...")
            .setRequired(true);

        const dateInput = new TextInputBuilder()
            .setCustomId('event_date')
            .setLabel("Tarih (GG/AA/YYYY Saat)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("26/04/2026 20:00")
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(linkInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(dateInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
        await interaction.showModal(modal);
    }
});

// Modal Gönderilince Çalışacak Kısım (Tribün Ekleme Aşaması)
client.on('interactionCreate', async interaction => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'match_modal') {
        const title = interaction.fields.getTextInputValue('event_title');
        
        const embed = new EmbedBuilder()
            .setTitle(`⚽ Maç Hazırlanıyor: ${title}`)
            .setDescription("Lütfen en az bir **Tribün** ekleyin. Tribün eklemeden maçı yayına alamazsınız.")
            .addFields(
                { name: '📅 Tarih', value: interaction.fields.getTextInputValue('event_date'), inline: true },
                { name: '🏟️ Mekan', value: interaction.fields.getTextInputValue('roblox_link'), inline: true }
            )
            .setColor('#E30613');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('add_tribune')
                .setLabel('➕ Tribün Ekle')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('finalize_event')
                .setLabel('✅ Yayına Al')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
});

client.login(process.env.DISCORD_TOKEN);

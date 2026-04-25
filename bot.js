const { 
    Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits 
} = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// SUNUCU ID'NI BURAYA YAZ (Komutların anında gelmesi için şart)
const MY_GUILD_ID = "SUNUCU_ID_BURAYA"; 

client.once('ready', async () => {
    console.log(`✅ ROPasso Sistemi Aktif: ${client.user.tag}`);
    
    // KOMUTLAR
    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('RoPasso sistemini sunucu için aktif eder.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
        new SlashCommandBuilder()
            .setName('setmatch')
            .setDescription('Yeni bir maç etkinliği oluşturur.'),

        new SlashCommandBuilder()
            .setName('setconcert')
            .setDescription('Yeni bir konser etkinliği oluşturur.'),

        new SlashCommandBuilder()
            .setName('adminduzenle')
            .setDescription('Yetkili rollerini günceller.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
            
        new SlashCommandBuilder()
            .setName('passomaclari')
            .setDescription('Mevcut biletlerini ve aktif maçları gösterir.')
    ];

    try {
        // Global beklemek yerine direkt sunucuya yüklüyoruz (Anında gelir)
        const guild = await client.guilds.fetch(MY_GUILD_ID);
        await guild.commands.set(commands);
        console.log("🔥 Komutlar sunucuya anında tanımlandı! Discord'u kapat-aç yapmana gerek yok.");
    } catch (err) {
        console.error("❌ Komutlar yüklenirken hata çıktı (Muhtemelen ID yanlış):", err);
    }
});

client.on('interactionCreate', async interaction => {
    // Yönetici Yetki Kontrolü
    if (interaction.guild && !interaction.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "❌ **Hata:** Botun 'Yönetici' yetkisi yok. Lütfen yetki verin.", ephemeral: true });
    }

    // --- SETUP KOMUTU ---
    if (interaction.commandName === 'setup') {
        const setupEmbed = new EmbedBuilder()
            .setTitle('🎫 RoPasso Kurulum Paneli')
            .setDescription('Sunucunuz için RoPasso artık aktif!\n\n**Admin Rolleri:** Maçları düzenleyecek rolleri ayarlayın.\nArtık `/adminduzenle` ile rolleri yönetebilirsiniz.')
            .setColor('#E30613')
            .setFooter({ text: 'Premium Passolig Deneyimi' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('setup_roles').setLabel('Yetkili Rolleri Ayarla').setStyle(ButtonStyle.Primary)
        );
        await interaction.reply({ embeds: [setupEmbed], components: [row] });
    }

    // --- SETMATCH / SETCONCERT ---
    if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
        const isMatch = interaction.commandName === 'setmatch';
        const modal = new ModalBuilder()
            .setCustomId(isMatch ? 'match_modal' : 'concert_modal')
            .setTitle(isMatch ? 'Yeni Maç Oluştur' : 'Yeni Konser Oluştur');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('event_title').setLabel(isMatch ? "Maç Adı (FB-GS vb.)" : "Sanatçı/Etkinlik Adı").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('roblox_link').setLabel("Roblox Mekan Linki").setStyle(TextInputStyle.Short).setPlaceholder("https://roblox.com/...").setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('event_date').setLabel("Tarih ve Saat").setStyle(TextInputStyle.Short).setPlaceholder("GG/AA/YYYY 20:00").setRequired(true))
        );
        await interaction.showModal(modal);
    }

    // --- BUTON ETKİLEŞİMLERİ ---
    if (interaction.isButton()) {
        if (interaction.customId === 'add_tribune') {
            const tModal = new ModalBuilder().setCustomId('tribune_form').setTitle('Tribün/Alan Ekle');
            tModal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_name').setLabel("Tribün İsmi").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_part').setLabel("Roblox Part İsmi (Workspace)").setStyle(TextInputStyle.Short).setRequired(true))
            );
            await interaction.showModal(tModal);
        }
        
        if (interaction.customId === 'setup_roles') {
            await interaction.reply({ content: "🛠️ Yetkili rolleri düzenleme menüsü ileride buraya eklenecek. Şu an `/adminduzenle` kullanabilirsiniz.", ephemeral: true });
        }
    }

    // --- MODAL SUBMIT ---
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'match_modal' || interaction.customId === 'concert_modal') {
            const title = interaction.fields.getTextInputValue('event_title');
            const date = interaction.fields.getTextInputValue('event_date');
            const link = interaction.fields.getTextInputValue('roblox_link');

            const embed = new EmbedBuilder()
                .setTitle(`✅ Etkinlik Hazırlanıyor: ${title}`)
                .setDescription("Lütfen en az bir **Tribün/Koltuk Alanı** ekleyin. Eklenmezse bilet satışı yapılamaz.")
                .addFields({ name: '📅 Tarih', value: date, inline: true }, { name: '🏟️ Link', value: link, inline: true })
                .setColor('#E30613');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('add_tribune').setLabel('➕ Tribün/Alan Ekle').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('finalize_event').setLabel('🚀 Yayına Al').setStyle(ButtonStyle.Primary)
            );
            await interaction.reply({ embeds: [embed], components: [row] });
        }

        if (interaction.customId === 'tribune_form') {
            const name = interaction.fields.getTextInputValue('t_name');
            const part = interaction.fields.getTextInputValue('t_part');
            await interaction.reply({ content: `✅ **${name}** tribünü başarıyla listeye eklendi! (Part: \`${part}\`)`, ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

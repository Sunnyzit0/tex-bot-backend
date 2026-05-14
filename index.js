require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildPresences
    ]
});

// Banco de dados para XP e Nível (Persistência)
let db = { users: {} };
if (fs.existsSync('./db.json')) {
    db = JSON.parse(fs.readFileSync('./db.json'));
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Configuração de IA Neutra para evitar o bloqueio de segurança do Google
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Você é o Tex, um assistente para Discord. Suas respostas são curtas e objetivas.",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

// Servidor para manter o Render Online
const app = express();
app.get('/', (req, res) => res.send("Tex Supremo Online"));
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => console.log(`🌐 Porta ${port} ativa.`));

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- SISTEMA DE XP E RANKING ---
    const uid = message.author.id;
    if (!db.users[uid]) {
        db.users[uid] = { xp: 0, level: 1, name: message.author.username };
    }
    
    db.users[uid].xp += 5;
    if (db.users[uid].xp >= db.users[uid].level * 200) {
        db.users[uid].level++;
    }
    fs.writeFileSync('./db.json', JSON.stringify(db));

    // --- RESPOSTA POR MENÇÃO (IA) ---
    if (!message.content.startsWith('!')) {
        if (message.mentions.has(client.user)) {
            try {
                const result = await model.generateContent(message.content);
                return message.reply(result.response.text());
            } catch (e) { 
                // Respostas variadas para falhas de filtro/key (image_85757a.png)
                const falas = ["Diga.", "O que foi?", "Fala.", "Oi.", "Tô ocupado."];
                return message.reply(falas[Math.floor(Math.random() * falas.length)]); 
            }
        }
        return;
    }

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- COMANDOS ---

    if (command === 'joke') {
        const memes = [
            "https://pbs.twimg.com/media/F_9z-3XW4AA8G_y.jpg",
            "https://pbs.twimg.com/media/F85s-3XW4AA8G_y.jpg",
            "https://pbs.twimg.com/media/GMcY89NWsAA5X_L.jpg"
        ];
        const memeUrl = memes[Math.floor(Math.random() * memes.length)];
        
        const embed = new EmbedBuilder()
            .setTitle("🐦 Meme do Chaos")
            .setImage(memeUrl)
            .setColor("#1DA1F2");

        // Enviamos o URL no conteúdo para forçar o Discord a carregar (image_8574e1.png)
        return message.reply({ content: memeUrl, embeds: [embed] });
    }

    if (command === 'perfil') {
        const u = db.users[uid];
        const embed = new EmbedBuilder()
            .setTitle(`🐙 Dossiê: ${message.author.username}`)
            .setColor('#5865F2')
            .addFields(
                { name: '📊 Nível', value: `${u.level}`, inline: true },
                { name: '✨ XP', value: `${u.xp}`, inline: true },
                { name: '🕒 Visto por último', value: 'Online agora mesmo 👀' }
            );
        return message.reply({ embeds: [embed] });
    }

    if (command === 'ranking') {
        const sorted = Object.values(db.users)
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 3);
            
        const embed = new EmbedBuilder()
            .setTitle('🐙 Lendas do Chaos')
            .setColor('#FFD700')
            .setDescription(sorted.map((u, i) => `${i+1}. **${u.name}**\nNível ${u.level} (${u.xp} XP)`).join('\n\n'));
            
        return message.reply({ embeds: [embed] });
    }

    if (command === 'pix') {
        return message.reply("💸 Chave PIX do Criador: **SuaChaveAqui**");
    }
});

client.on('ready', () => {
    console.log(`✅ TEX ONLINE - Vigiando o servidor.`);
    client.user.setActivity('Chaos', { type: ActivityType.Watching });
});

client.login(process.env.DISCORD_TOKEN);
require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences]
});

let db = { users: {} };
if (fs.existsSync('./db.json')) db = JSON.parse(fs.readFileSync('./db.json'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    // Instrução suavizada para o Google não barrar a IA antes dela falar
    systemInstruction: "Você é o Tex, um assistente de humor ácido e sarcástico. Responda de forma curta, debochada e direta. Não use nomes e evite termos proibidos.",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

const app = express();
app.get('/', (req, res) => res.send("Tex Online"));
app.listen(process.env.PORT || 10000);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const uid = message.author.id;
    if (!db.users[uid]) db.users[uid] = { xp: 0, level: 1, name: message.author.username };
    db.users[uid].xp += 5;
    if (db.users[uid].xp >= db.users[uid].level * 200) db.users[uid].level++;
    fs.writeFileSync('./db.json', JSON.stringify(db));

    if (!message.content.startsWith('!')) {
        if (message.mentions.has(client.user)) {
            try {
                const result = await model.generateContent(message.content);
                return message.reply(result.response.text());
            } catch (e) { 
                return message.reply("Sem paciência agora. Pergunta outra coisa."); 
            }
        }
        return;
    }

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // COMANDO !JOKE CORRIGIDO (COM EMBED PARA MOSTRAR A IMAGEM)
    if (command === 'joke') {
        const memes = [
            "https://pbs.twimg.com/media/F_9z-3XW4AA8G_y.jpg",
            "https://pbs.twimg.com/media/F85s-3XW4AA8G_y.jpg",
            "https://pbs.twimg.com/media/GMcY89NWsAA5X_L.jpg"
        ];
        const memeUrl = memes[Math.floor(Math.random() * memes.length)];
        
        const embed = new EmbedBuilder()
            .setTitle("🐦 Meme do Twitter")
            .setImage(memeUrl)
            .setColor("#1DA1F2");

        return message.reply({ embeds: [embed] });
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
        const sorted = Object.values(db.users).sort((a, b) => b.xp - a.xp).slice(0, 3);
        const embed = new EmbedBuilder()
            .setTitle('🐙 Lendas do Chaos')
            .setColor('#FFD700')
            .setDescription(sorted.map((u, i) => `${i+1}. **${u.name}**\nNível ${u.level} (${u.xp} XP)`).join('\n\n'));
        return message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
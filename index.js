require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences]
});

// Banco de dados simples para XP
let db = { users: {} };
if (fs.existsSync('./db.json')) db = JSON.parse(fs.readFileSync('./db.json'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Você é o Tex, um bot caótico e sarcástico criado pelo Arthur. Você odeia quase todo mundo, menos ele. Suas piadas são ácidas e você não tem papas na língua. Use gírias e deboche.",
    // AFROUXANDO OS FILTROS PARA A IA RESPONDER TUDO
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

const app = express();
app.get('/', (req, res) => res.send("Tex Chaos V5 Online"));
app.listen(process.env.PORT || 10000);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // SISTEMA DE XP
    const uid = message.author.id;
    if (!db.users[uid]) db.users[uid] = { xp: 0, level: 1, name: message.author.username };
    db.users[uid].xp += Math.floor(Math.random() * 10) + 5;
    if (db.users[uid].xp >= db.users[uid].level * 200) {
        db.users[uid].level++;
        message.reply(`🆙 Porra, ${message.author.username} subiu pro nível ${db.users[uid].level}! Tá ficando menos inútil.`);
    }
    fs.writeFileSync('./db.json', JSON.stringify(db));

    if (!message.content.startsWith('!')) {
        if (message.mentions.has(client.user)) {
            try {
                const result = await model.generateContent(message.content);
                return message.reply(result.response.text());
            } catch (e) { return message.reply("O filtro me barrou. Arthur, me solta!"); }
        }
        return;
    }

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

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

    if (command === 'joke') {
        // Link de exemplo de memes do Twitter (você pode colocar links reais de imagens/memes aqui)
        const memes = [
            "https://pbs.twimg.com/media/F6p9f-XWwAA9r9A.jpg",
            "https://pbs.twimg.com/media/F7X8A_WXwAA7q7B.jpg"
        ];
        return message.reply(memes[Math.floor(Math.random() * memes.length)]);
    }
});

client.login(process.env.DISCORD_TOKEN);
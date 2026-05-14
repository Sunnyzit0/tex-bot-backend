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
    // Instrução neutra para evitar o bloqueio da image_85ecc3.png
    systemInstruction: "Você é o Tex, um bot de chat direto e sincero. Responda de forma curta.",
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

    // Sistema de XP
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
                const falas = ["Tô ocupado.", "Pergunta depois.", "Agora não.", "Preguiça."];
                return message.reply(falas[Math.floor(Math.random() * falas.length)]); 
            }
        }
        return;
    }

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'joke') {
        const memes = [
            "https://pbs.twimg.com/media/F_9z-3XW4AA8G_y.jpg",
            "https://pbs.twimg.com/media/F85s-3XW4AA8G_y.jpg",
            "https://pbs.twimg.com/media/GMcY89NWsAA5X_L.jpg"
        ];
        const embed = new EmbedBuilder().setTitle("🐦 Meme").setImage(memes[Math.floor(Math.random() * memes.length)]).setColor("#1DA1F2");
        return message.reply({ embeds: [embed] });
    }

    if (command === 'perfil') {
        const u = db.users[uid];
        const embed = new EmbedBuilder()
            .setTitle(`🐙 Dossiê: ${message.author.username}`)
            .setColor('#5865F2')
            .addFields({ name: '📊 Nível', value: `${u.level}`, inline: true }, { name: '✨ XP', value: `${u.xp}`, inline: true });
        return message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
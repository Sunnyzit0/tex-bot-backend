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

let db = { users: {} };
if (fs.existsSync('./db.json')) db = JSON.parse(fs.readFileSync('./db.json'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest", 
    systemInstruction: "Você é o Tex, um bot sarcástico. Criado por Sunny.",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }
    ]
});

const app = express();
app.get('/', (req, res) => res.send("Tex Ativo"));
app.listen(process.env.PORT || 10000);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // XP
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
                const falas = ["Diga.", "Fala.", "Tô ocupado."];
                return message.reply(falas[Math.floor(Math.random() * falas.length)]); 
            }
        }
        return;
    }

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // COMANDO !VERSÃO (LIMPO)
    if (command === 'versão') {
        const embed = new EmbedBuilder()
            .setTitle("⚙️ Status do Sistema")
            .setColor("#00FF00")
            .addFields(
                { name: "Versão", value: "Tex V5.9", inline: true },
                { name: "Criador", value: "Sunny", inline: true }
            );
        return message.reply({ embeds: [embed] });
    }

    // COMANDO !JOKE (FIX DE IMAGEM)
    if (command === 'joke') {
        const memes = [
            "https://i.imgur.com/8m5uNfX.jpeg", // Links mais estáveis
            "https://i.imgur.com/k6wR6Gk.jpeg"
        ];
        const memeUrl = memes[Math.floor(Math.random() * memes.length)];
        return message.reply({ content: memeUrl }); // Link direto carrega melhor que embed
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
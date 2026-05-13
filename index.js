require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('moment/locale/pt-br');
moment.locale('pt-br');
const axios = require('axios');
const express = require('express');
const cors = require('cors');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions
    ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const dbPath = './atividade.json';
let db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
const salvarDB = () => fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

const app = express();
app.use(cors());
app.get('/api/stats', (req, res) => res.json(db));

// --- AJUSTE PARA HOSPEDAGEM ---
// O Render ou qualquer nuvem vai definir a porta automaticamente.
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`🌐 API rodando na porta ${port}`));

// ... (Restante do código de áudio e comandos permanece igual)

async function tocarPix(message) {
    if (!message.member.voice.channel) return;
    try {
        const connection = joinVoiceChannel({
            channelId: message.member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'pix.mp3'));
        player.play(resource);
        connection.subscribe(player);
        player.on(AudioPlayerStatus.Idle, () => connection.destroy());
    } catch (e) { console.error("Erro no áudio:", e); }
}

client.on('ready', () => {
    console.log(`🐙 Tex Supremo Online!`);
    client.user.setActivity('Observando o Chaos', { type: ActivityType.Watching });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!db[message.author.id]) {
        db[message.author.id] = { name: message.author.username, xp: 0, level: 1, msgCount: 0, avisado: false, perfil: "" };
    }
    let user = db[message.author.id];
    user.lastInteraction = Date.now();
    user.msgCount++;
    user.xp = (user.xp || 0) + Math.floor(Math.random() * 10) + 5;
    user.level = user.level || 1;

    if (user.xp >= user.level * 200) {
        user.level++;
        message.reply(`⭐ **LEVEL UP!** Nível **${user.level}**!`);
    }
    salvarDB();

    if (message.content.startsWith('!aprender')) {
        const args = message.content.split(' ');
        const alvo = message.mentions.members.first();
        if (!alvo) return;
        const nota = args.slice(2).join(' ');
        db[alvo.id].perfil = (db[alvo.id].perfil || "").replace("undefined", "") + `${nota}. `;
        salvarDB();
        return message.reply(`📝 Anotado.`);
    }

    if (message.mentions.has(client.user)) {
        const prompt = message.content.replace(`<@${client.user.id}>`, "").trim();
        if (!prompt) return;
        try {
            message.channel.sendTyping();
            const fofoca = user.perfil ? user.perfil : "Novato no Chaos.";
            const context = `Você é o Tex do servidor Chaos. Sarcástico. Sobre ${message.author.username}: ${fofoca}. Pergunta: ${prompt}`;
            const result = await model.generateContent(context);
            return message.reply(result.response.text());
        } catch (e) { return message.reply("🐙 Meus tentáculos deram um nó."); }
    }

    if (message.content.startsWith('!perfil')) {
        const alvo = message.mentions.members.first() || message.member;
        let tUser = db[alvo.id] || { name: alvo.user.username, xp: 0, level: 1 };
        const embed = new EmbedBuilder()
            .setTitle(`🐙 Dossiê: ${alvo.user.username}`)
            .addFields(
                { name: '📊 Nível', value: `${tUser.level}`, inline: true },
                { name: '✨ XP', value: `${tUser.xp}`, inline: true }
            );
        if (tUser.perfil) embed.addFields({ name: '📝 Fofocas', value: tUser.perfil.replace("undefined", "") });
        return message.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
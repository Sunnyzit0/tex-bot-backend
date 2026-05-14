require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');

// ──────────────────────────────────────────
//  CLIENTE DISCORD
// ──────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// ──────────────────────────────────────────
//  BANCO DE DADOS (JSON simples)
// ──────────────────────────────────────────
let db = { users: {} };
if (fs.existsSync('./db.json')) {
    try {
        db = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));
    } catch (e) {
        console.error('[DB] Erro ao ler db.json, iniciando vazio.', e);
    }
}

// Debounce: salva o db no máximo uma vez a cada 5s
let saveTimeout;
function saveDb() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        fs.writeFileSync('./db.json', JSON.stringify(db, null, 2));
    }, 5000);
}

// ──────────────────────────────────────────
//  GEMINI
//  FIX: "gemini-1.5-flash-latest" foi descontinuado
//  Use "gemini-1.5-flash" ou "gemini-2.0-flash"
// ──────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",          // ← corrigido aqui
    systemInstruction: "Você é o Tex, um bot sarcástico e bem-humorado. Criado por Sunny. Responda sempre em português.",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT,  threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE }
    ]
});

// Histórico de conversa por usuário (em memória)
const chatSessions = {};

async function responderGemini(uid, texto) {
    if (!chatSessions[uid]) {
        chatSessions[uid] = model.startChat({ history: [] });
    }
    const result = await chatSessions[uid].sendMessage(texto);
    const response = result.response;

    // FIX: detecta bloqueio por safety antes de chamar .text()
    if (response.promptFeedback?.blockReason) {
        console.warn(`[Gemini] Bloqueado para ${uid}: ${response.promptFeedback.blockReason}`);
        return null;
    }

    return response.text();
}

// ──────────────────────────────────────────
//  EXPRESS (keep-alive)
// ──────────────────────────────────────────
const app = express();
app.get('/', (_, res) => res.send("Tex Ativo"));
app.get('/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.listen(process.env.PORT || 10000, () => console.log('[Express] Servidor rodando.'));

// ──────────────────────────────────────────
//  EVENTOS
// ──────────────────────────────────────────
client.once('ready', () => {
    console.log(`[Bot] Logado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const uid  = message.author.id;
    const user = message.author.username;

    // ── XP & LEVEL ──
    if (!db.users[uid]) db.users[uid] = { xp: 0, level: 1, name: user };

    db.users[uid].xp += 5;
    const xpNecessario = db.users[uid].level * 200;

    if (db.users[uid].xp >= xpNecessario) {
        db.users[uid].xp -= xpNecessario;   // reseta XP do nível atual
        db.users[uid].level++;
        message.channel.send(`🎉 ${message.author}, você subiu para o nível **${db.users[uid].level}**!`);
    }

    saveDb(); // debounced — não trava mais a cada mensagem

    // ── MENÇÃO → Gemini ──
    if (!message.content.startsWith('!')) {
        if (message.mentions.has(client.user)) {
            await message.channel.sendTyping();
            try {
                const resposta = await responderGemini(uid, message.content);
                if (resposta) return message.reply(resposta);
                return message.reply("Não consegui processar isso agora.");
            } catch (e) {
                console.error('[Gemini] Erro:', e?.message || e);
                const falas = ["Diga.", "Fala.", "Tô ocupado.", "Sem resposta por enquanto."];
                return message.reply(falas[Math.floor(Math.random() * falas.length)]);
            }
        }
        return;
    }

    // ── COMANDOS ──
    const args    = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // !versao / !versão
    if (command === 'versao' || command === 'versão') {
        const embed = new EmbedBuilder()
            .setTitle("⚙️ Status do Sistema")
            .setColor("#00FF00")
            .addFields(
                { name: "Versão",  value: "Tex V6.0", inline: true },
                { name: "Criador", value: "Sunny",    inline: true },
                { name: "Model",   value: "Gemini 2.0 Flash", inline: true }
            );
        return message.reply({ embeds: [embed] });
    }

    // !joke
    if (command === 'joke') {
        try {
            const res  = await fetch('https://meme-api.com/gimme');
            const data = await res.json();
            if (data?.url) return message.reply({ content: data.url });
        } catch (_) {}
        // fallback caso a API esteja fora
        const fallback = [
            "https://i.imgur.com/8m5uNfX.jpeg",
            "https://i.imgur.com/k6wR6Gk.jpeg"
        ];
        return message.reply({ content: fallback[Math.floor(Math.random() * fallback.length)] });
    }

    // !perfil
    if (command === 'perfil') {
        const u = db.users[uid] || { xp: 0, level: 1 };
        const embed = new EmbedBuilder()
            .setTitle(`🐙 Dossiê: ${user}`)
            .setColor('#5865F2')
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: '📊 Nível', value: `${u.level}`, inline: true },
                { name: '✨ XP',    value: `${u.xp}`,    inline: true },
                { name: '🎯 Próximo nível', value: `${u.level * 200 - u.xp} XP restantes`, inline: true }
            );
        return message.reply({ embeds: [embed] });
    }

    // !rank
    if (command === 'rank') {
        const ranking = Object.entries(db.users)
            .sort(([, a], [, b]) => b.level - a.level || b.xp - a.xp)
            .slice(0, 5);

        const medalhas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
        const lista = ranking
            .map(([, u], i) => `${medalhas[i]} **${u.name}** — Nível ${u.level} (${u.xp} XP)`)
            .join('\n') || 'Ninguém no ranking ainda.';

        const embed = new EmbedBuilder()
            .setTitle('🏆 Top 5 — Ranking')
            .setColor('#FFD700')
            .setDescription(lista);
        return message.reply({ embeds: [embed] });
    }
});

// ──────────────────────────────────────────
//  LOGIN
// ──────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
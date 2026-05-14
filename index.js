require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const cors = require('cors');

console.log("=========================================");
console.log("🚀 TEX ONLINE - VERSÃO V3.2");
console.log("=========================================");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
app.use(cors());
app.get('/', (req, res) => res.send("Tex Supremo está online!"));

// Abre a porta imediatamente para o Render validar o deploy
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 RENDER: Porta ${port} aberta.`);
});

client.on('ready', () => {
    console.log(`✅ SUCESSO: Tex logado como ${client.user.tag}`);
    client.user.setActivity('Chaos', { type: ActivityType.Watching });
});

client.on('error', (err) => console.error("❌ ERRO NO CLIENTE:", err));

async function iniciarBot() {
    if (!process.env.DISCORD_TOKEN) return console.error("⚠️ SEM TOKEN!");
    
    console.log("⏳ Solicitando conexão ao Discord...");
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        console.error("❌ FALHA NO LOGIN:", err.message);
        console.log("🔄 Tentando novamente em 1 minuto...");
        setTimeout(iniciarBot, 60000);
    }
}

iniciarBot();
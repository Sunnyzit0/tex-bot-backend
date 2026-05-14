require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const cors = require('cors');

console.log("=========================================");
console.log("🚀 TEX ONLINE - VERSÃO V3.1 (ANTI-BLOCK)");
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
app.get('/', (req, res) => res.send("Tex Supremo está aguardando o Discord..."));

// LIGA A PORTA IMEDIATAMENTE (Resolve o erro da image_91ab5f.png)
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 RENDER: Porta ${port} aberta com sucesso.`);
});

client.on('ready', () => {
    console.log(`✅ SUCESSO: Tex logado como ${client.user.tag}`);
    client.user.setActivity('Chaos', { type: ActivityType.Watching });
});

client.on('error', (err) => console.error("❌ ERRO NO DISCORD:", err.message));

// FUNÇÃO DE LOGIN COM RE-TENTATIVA
async function iniciarBot() {
    if (!process.env.DISCORD_TOKEN) return console.error("⚠️ SEM TOKEN!");
    
    console.log("⏳ Tentando handshake com o Discord...");
    try {
        await client.login(process.env.DISCORD_TOKEN);
        console.log("✅ Comando de login enviado!");
    } catch (err) {
        console.error("❌ FALHA NO LOGIN:", err.message);
        console.log("🔄 Tentando novamente em 30 segundos...");
        setTimeout(iniciarBot, 30000); // Tenta de novo se o IP estiver bloqueado
    }
}

iniciarBot();
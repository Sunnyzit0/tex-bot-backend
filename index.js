require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const cors = require('cors');

console.log("=========================================");
console.log("🚀 TEX ONLINE - VERSÃO PRODUÇÃO");
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
app.get('/', (req, res) => res.send("Tex API Online"));

client.on('ready', () => {
    console.log(`✅ SUCESSO: Tex Supremo Online como ${client.user.tag}`);
    client.user.setActivity('Chaos', { type: ActivityType.Watching });
});

client.on('error', (err) => console.error("❌ ERRO NO DISCORD:", err.message));

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 API ONLINE NA PORTA ${port}`);
    if (process.env.DISCORD_TOKEN) {
        client.login(process.env.DISCORD_TOKEN)
            .then(() => console.log("⏳ Login enviado com sucesso!"))
            .catch(err => console.error("❌ FALHA NO LOGIN:", err.message));
    }
});
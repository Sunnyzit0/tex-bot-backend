require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');
const cors = require('cors');

console.log("=========================================");
console.log("🚀 VERSÃO FINAL DE RESGATE - TEX");
console.log("TOKEN PRESENTE:", !!process.env.DISCORD_TOKEN);
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
app.get('/api/stats', (req, res) => res.send("Tex API Online"));

client.on('ready', () => {
    console.log(`✅ SUCESSO: Tex Supremo Online como ${client.user.tag}`);
});

client.on('error', (err) => console.error("❌ ERRO NO CLIENTE:", err.message));

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 API ONLINE NA PORTA ${port}`);
    if (process.env.DISCORD_TOKEN) {
        client.login(process.env.DISCORD_TOKEN)
            .then(() => console.log("⏳ Aguardando resposta do Discord..."))
            .catch(err => console.error("❌ FALHA NO LOGIN:", err.message));
    }
});
require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');
const cors = require('cors');

console.log("=========================================");
console.log("🚀 VERSÃO DE EMERGÊNCIA - TEX");
console.log("TOKEN PRESENTE NO SISTEMA:", !!process.env.DISCORD_TOKEN);
console.log("=========================================");

// Intents reduzidas ao mínimo absoluto para teste
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
app.use(cors());
app.get('/', (req, res) => res.send("Tex Online"));

client.on('ready', () => {
    console.log(`✅ SUCESSO ABSOLUTO: Logado como ${client.user.tag}`);
});

client.on('error', (err) => console.error("❌ ERRO NO DISCORD:", err.message));

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 API ONLINE NA PORTA ${port}`);
    if (process.env.DISCORD_TOKEN) {
        console.log("⏳ Enviando comando de login...");
        client.login(process.env.DISCORD_TOKEN)
            .then(() => console.log("✅ Token aceito!"))
            .catch(err => console.error("❌ FALHA NO LOGIN:", err.message));
    }
});
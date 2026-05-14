require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const cors = require('cors');

console.log("=========================================");
console.log("🚀 TEX ONLINE - VERSÃO PRODUÇÃO V3.0");
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
app.get('/', (req, res) => res.send("Tex Supremo está vivo!"));

// SÓ LIGA O SERVIDOR WEB DEPOIS QUE O BOT ESTIVER PRONTO
client.on('ready', () => {
    console.log(`✅ SUCESSO: Tex Supremo Online como ${client.user.tag}`);
    client.user.setActivity('Chaos', { type: ActivityType.Watching });

    const port = process.env.PORT || 10000;
    app.listen(port, '0.0.0.0', () => {
        console.log(`🌐 API DO RENDER LIBERADA NA PORTA ${port}`);
    });
});

client.on('error', (err) => console.error("❌ ERRO NO DISCORD:", err.message));

// INICIA PELO LOGIN
if (process.env.DISCORD_TOKEN) {
    console.log("⏳ Iniciando handshake com o Discord...");
    client.login(process.env.DISCORD_TOKEN)
        .catch(err => {
            console.error("❌ FALHA NO LOGIN:", err.message);
            // Se falhar o login, tenta abrir a porta mesmo assim para o Render não dar erro de deploy
            app.listen(process.env.PORT || 10000, '0.0.0.0');
        });
} else {
    console.error("⚠️ TOKEN NÃO ENCONTRADO NO AMBIENTE");
}
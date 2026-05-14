require('dotenv').config(); 

const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');
const cors = require('cors');

// DEBUG DE AMBIENTE
console.log("=========================================");
console.log("🚀 DIAGNÓSTICO FINAL - TEX V2.5");
console.log("TOKEN PRESENTE:", !!process.env.DISCORD_TOKEN);
console.log("=========================================");

// Intents mínimas para evitar erros de permissão
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "key_vazia");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const dbPath = './atividade.json';
let db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
const salvarDB = () => fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

const app = express();
app.use(cors());
app.get('/api/stats', (req, res) => res.json(db));

client.on('ready', () => {
    console.log(`🐙 Tex Supremo Online! Logado como: ${client.user.tag}`);
    client.user.setActivity('Chaos', { type: ActivityType.Watching });
});

client.on('error', (err) => console.error("❌ ERRO NO CLIENTE:", err.message));

// Servidor Express (Obrigatório para o Render)
const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 API ONLINE NA PORTA ${port}`);
    
    if (process.env.DISCORD_TOKEN) {
        console.log("⏳ Tentando login simplificado...");
        client.login(process.env.DISCORD_TOKEN)
            .then(() => console.log("✅ Conexão estabelecida com sucesso!"))
            .catch(err => {
                console.error("❌ FALHA NO LOGIN:");
                console.error("ERRO:", err.message);
            });
    }
});
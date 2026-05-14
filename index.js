require('dotenv').config(); 

const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');
const cors = require('cors');

// DEBUG DE INICIALIZAÇÃO
console.log("=========================================");
console.log("🚀 DEBUG DE CONEXÃO - TEX V2.3");
console.log("HORA DO SISTEMA:", new Date().toISOString());
console.log("DISCORD_TOKEN PRESENTE:", !!process.env.DISCORD_TOKEN);
console.log("=========================================");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "key_nula");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const dbPath = './atividade.json';
let db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
const salvarDB = () => fs.writeFileSync(dbPath, JSON.stringify(db, null, 4));

const app = express();
app.use(cors());
app.get('/api/stats', (req, res) => res.json(db));

client.on('ready', () => {
    console.log(`🐙 Tex Supremo Online! Logado como: ${client.user.tag}`);
    client.user.setActivity('Observando o Chaos', { type: ActivityType.Watching });
});

// CAPTURA DE ERROS TÉCNICOS
client.on('error', (err) => console.error("❌ ERRO NO CLIENTE DISCORD:", err));
process.on('unhandledRejection', error => console.error('❌ ERRO NÃO TRATADO:', error));

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 API ONLINE NA PORTA ${port}`);
    
    if (process.env.DISCORD_TOKEN) {
        console.log("⏳ Iniciando tentativa de login no Discord...");
        client.login(process.env.DISCORD_TOKEN)
            .then(() => console.log("✅ Token aceito! Aguardando evento 'ready'..."))
            .catch(err => {
                console.error("❌ FALHA CRÍTICA NO LOGIN:");
                console.error("MENSAGEM:", err.message);
                console.error("CÓDIGO:", err.code);
            });
    } else {
        console.error("⚠️ ERRO: DISCORD_TOKEN vazio no ambiente.");
    }
});
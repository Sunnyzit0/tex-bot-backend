require('dotenv').config(); 

const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const express = require('express');
const cors = require('cors');

console.log("=========================================");
console.log("🚀 DEBUG DE CONEXÃO - TEX V2.4");
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

client.on('error', (err) => console.error("❌ ERRO NO CLIENTE:", err));

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 API ONLINE NA PORTA ${port}`);
    
    if (process.env.DISCORD_TOKEN) {
        console.log("⏳ Enviando comando de login...");
        
        // Timer de segurança: Se em 15s não logar, avisa no log
        const timeout = setTimeout(() => {
            console.error("⚠️ O Discord está demorando demais para responder. Verifique as INTENTS no Portal!");
        }, 15000);

        client.login(process.env.DISCORD_TOKEN)
            .then(() => {
                clearTimeout(timeout);
                console.log("✅ Conexão estabelecida!");
            })
            .catch(err => {
                clearTimeout(timeout);
                console.error("❌ FALHA NO LOGIN:", err.message);
            });
    }
});
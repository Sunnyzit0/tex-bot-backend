require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const cors = require('cors');

console.log("=========================================");
console.log("🚀 OPERAÇÃO RESGATE FINAL - TEX");
console.log("=========================================");

// Reduzindo intents ao mínimo do mínimo para tentar passar pelo firewall do Discord
const client = new Client({
    intents: [GatewayIntentBits.Guilds] 
});

const app = express();
app.use(cors());
app.get('/', (req, res) => res.send("Tex Status: Awaiting Discord..."));

client.on('ready', () => {
    console.log(`✅ MILAGRE: Tex logado como ${client.user.tag}`);
});

// Isso vai nos dizer se o Discord está ativamente fechando a conexão
client.on('shardDisconnect', (event) => {
    console.error("❌ Discord fechou a conexão (Shard Disconnect):", event);
});

client.on('error', (err) => console.error("❌ ERRO TÉCNICO:", err));

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 API ONLINE NA PORTA ${port}`);
    if (process.env.DISCORD_TOKEN) {
        console.log("⏳ Iniciando login...");
        client.login(process.env.DISCORD_TOKEN).catch(err => {
            console.error("❌ FALHA NO LOGIN:", err.message);
        });
    }
});
require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const cors = require('cors');

// Configuração do Cliente com Intents essenciais para leitura de mensagens
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Necessário para ler o conteúdo das mensagens
    ]
});

// Inicialização da IA Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Servidor Express para manter o Render ativo
const app = express();
app.use(cors());
app.get('/', (req, res) => res.send("Tex Supremo está online e operante!"));

const port = process.env.PORT || 10000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 RENDER: Porta ${port} aberta com sucesso.`);
});

// Evento: Quando o bot conecta com sucesso
client.on('ready', () => {
    console.log(`✅ SUCESSO: Tex logado como ${client.user.tag}`);
    client.user.setActivity('Chaos', { type: ActivityType.Watching });
});

// Evento: Lógica de resposta a mensagens
client.on('messageCreate', async (message) => {
    // Ignora mensagens de outros bots
    if (message.author.bot) return;

    // Responde se for marcado ou usar o prefixo !tex
    if (message.mentions.has(client.user) || message.content.toLowerCase().startsWith('!tex')) {
        const prompt = message.content.replace(/<@!\d+>|<@\d+>|!tex/gi, '').trim();
        
        if (!prompt) return message.reply("Fala tu, o que manda?");

        try {
            console.log(`[LOG] Processando pergunta de ${message.author.username}`);
            await message.channel.sendTyping();

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Divide a mensagem caso ultrapasse o limite de 2000 caracteres do Discord
            if (text.length > 2000) {
                const chunks = text.match(/[\s\S]{1,2000}/g);
                for (const chunk of chunks) {
                    await message.reply(chunk);
                }
            } else {
                await message.reply(text);
            }
        } catch (error) {
            console.error("❌ Erro no Gemini:", error.message);
            message.reply("Minha mente deu um nó... tenta de novo em um minuto.");
        }
    }
});

client.on('error', (err) => console.error("❌ ERRO NO CLIENTE:", err.message));

// Login com tratamento de erro
if (process.env.DISCORD_TOKEN) {
    client.login(process.env.DISCORD_TOKEN).catch(err => {
        console.error("❌ FALHA CRÍTICA NO LOGIN:", err.message);
    });
} else {
    console.error("⚠️ ERRO: DISCORD_TOKEN não configurado!");
}
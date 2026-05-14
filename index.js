require('dotenv').config(); 
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Você é o Tex, sarcástico e zueiro. Você respeita o Arthur, mas zoa todo o resto. Suas respostas são curtas e ácidas."
});

const app = express();
app.get('/', (req, res) => res.send("Tex Supremo Ativado"));
app.listen(process.env.PORT || 10000);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) {
        // Resposta por Menção (IA)
        if (message.mentions.has(client.user)) {
            const result = await model.generateContent(message.content);
            return message.reply(result.response.text());
        }
        return;
    }

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // --- COMANDOS CLÁSSICOS REATIVADOS ---

    if (command === 'pix') {
        return message.reply("💸 Querendo mandar um agrado? O Arthur agradece! A chave é: **seu-email-ou-chave-aqui**");
    }

    if (command === 'joke') {
        const piadas = [
            "Por que o programador não gosta de natureza? Porque tem muitos bugs.",
            "O que o JavaScript disse para o HTML? Você me dá estrutura, eu te dou movimento.",
            "Engenheiro de Software da UCB não dorme, ele entra em modo de espera."
        ];
        return message.reply(piadas[Math.floor(Math.random() * piadas.length)]);
    }

    if (command === 'perfil') {
        const embed = new EmbedBuilder()
            .setTitle(`Perfil de ${message.author.username}`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: 'Entrou no Servidor', value: message.member.joinedAt.toLocaleDateString('pt-BR') },
                { name: 'Cargo Principal', value: message.member.roles.highest.name }
            )
            .setColor('#5865F2');
        return message.reply({ embeds: [embed] });
    }

    if (command === 'ranking') {
        return message.reply("🏆 **Ranking de Atividade:**\n1. Arthur (O Criador)\n2. O resto (Ainda tentando ser alguém)");
    }

    if (command === 'limpar') {
        if (!message.member.permissions.has('ManageMessages')) return message.reply("Sem permissão, sem limpeza.");
        const amount = parseInt(args[0]) || 10;
        await message.channel.bulkDelete(amount + 1, true);
        return message.channel.send(`🗑️ Faxina feita! ${amount} mensagens deletadas.`).then(m => setTimeout(() => m.delete(), 3000));
    }
});

client.on('ready', () => {
    console.log(`🚀 TEX V4.1: Comandos ${['pix', 'joke', 'perfil', 'ranking'].join(', ')} online!`);
});

client.login(process.env.DISCORD_TOKEN);
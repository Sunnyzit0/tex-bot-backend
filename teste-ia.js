require('dotenv').config();

async function verificarModelos() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return console.log("❌ Chave não encontrada no .env!");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        console.log("🔍 Consultando o servidor do Google...");
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (dados.error) {
            console.error("❌ Erro da API do Google:", dados.error.message);
            return;
        }

        console.log("\n✅ Modelos que a sua chave está autorizada a usar:");
        dados.models.forEach(modelo => {
            // Filtra só os que servem para gerar texto
            if (modelo.supportedGenerationMethods.includes('generateContent')) {
                // Remove o prefixo 'models/' para mostrar o nome exato que precisamos usar
                console.log(`➡️  ${modelo.name.replace('models/', '')}`);
            }
        });
        
        console.log("\nCopie um desses nomes com a setinha para colocarmos no index.js!");

    } catch (erro) {
        console.error("Erro de conexão:", erro);
    }
}

verificarModelos();
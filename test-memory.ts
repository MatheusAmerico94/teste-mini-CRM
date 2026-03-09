import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

(async () => {
    try {
        const { processIncomingMessage } = await import('./lib/services/chat.ts');
        const dbLayer = await import('./lib/db/index.ts');
        const schema = await import('./lib/db/schema.ts');

        // Pega o admin
        const adminUser = await dbLayer.db.query.users.findFirst();
        if (!adminUser) { console.error("Sem usuário admin"); process.exit(1); }

        console.log("Simulando msg 1: Oi, meu nome é Testador...");
        let reply1 = await processIncomingMessage(adminUser.id, "5511999999999", "Oi, meu nome é Testador");
        console.log("IA respondeu:", reply1);

        console.log("\nSimulando msg 2: Qual era o meu nome mesmo?... (Testando Memória)");
        let reply2 = await processIncomingMessage(adminUser.id, "5511999999999", "Qual era o meu nome mesmo?");
        console.log("IA respondeu:", reply2);

        process.exit(0);

    } catch (e) {
        console.error("Erro no teste:", e);
        process.exit(1);
    }
})();

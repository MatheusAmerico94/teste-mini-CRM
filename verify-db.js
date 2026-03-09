import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import postgres from 'postgres';

async function verifyDB() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    try {
        const users = await sql`SELECT id, clerk_user_id, email FROM users`;
        const leads = await sql`SELECT id, user_id, name, phone, temperature FROM leads`;
        const activities = await sql`SELECT type, content, lead_id FROM activities ORDER BY created_at DESC LIMIT 5`;
        const connections = await sql`SELECT user_id, status FROM whatsapp_connections`;
        const agents = await sql`SELECT id, user_id, name, is_active FROM agents`;
        console.log('--- USERS ---');
        console.log(users);
        console.log('--- CONNECTIONS ---');
        console.log(connections);
        console.log('--- AGENTS ---');
        console.log(agents);
        console.log('--- LEADS ---');
        console.log(leads);
        console.log('--- ACTIVITIES ---');
        console.log(activities);
    } catch (e) { console.error(e); }
    finally { sql.end(); }
}
verifyDB();

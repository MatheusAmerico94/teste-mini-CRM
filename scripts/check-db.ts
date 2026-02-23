import { db } from '../lib/db';
import { users, agents } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('--- Checking Database Connectivity ---');
    try {
        const result = await db.execute(sql`SELECT 1`);
        console.log('✅ Connection successful');

        console.log('\n--- Checking Tables ---');

        const tables = ['users', 'leads', 'activities', 'agents', 'whatsapp_connections'];

        for (const table of tables) {
            try {
                const count = await db.execute(sql`SELECT count(*) FROM ${sql.identifier(table)}`);
                console.log(`✅ Table "${table}" found. Rows: ${JSON.stringify(count[0])}`);
            } catch (e: any) {
                console.log(`❌ Table "${table}" NOT FOUND error: ${e.message}`);
            }
        }

    } catch (e: any) {
        console.error('❌ Database connection failed:', e.message);
    }
    process.exit(0);
}

main();

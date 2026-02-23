import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// For query purposes
const queryClient = postgres(connectionString, {
    ssl: 'require',
    prepare: false, // Recommended for some serverless environments to avoid issues with connection pooling
});
export const db = drizzle(queryClient, { schema });

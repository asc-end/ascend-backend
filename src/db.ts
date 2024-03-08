import { Client } from 'pg';

const client = new Client({
    connectionString: process.env.ENVIRONMNENT == "production" ? process.env.DATABASE_PRIVATE_URL : process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default client
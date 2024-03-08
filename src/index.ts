import express from "express";
import { Client } from 'pg';

const app = express();

const client = new Client({
    connectionString: process.env.ENVIRONMNENT == "production" ? process.env.DATABASE_PRIVATE_URL : process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
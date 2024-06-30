import express from "express";
import userRoutes from "./routes/users/routes"
import friendshipsRoutes from "./routes/friendships/routes"
import challengesRoutes from "./routes/challenges/routes"
import githubRoutes from "./routes/integrations/github/routes"
import flashcardsRoutes from "./routes/flashcards/routes"
import farcasterRoutes from "./routes/integrations/farcaster/routes"
import twitterRoutes from "./routes/integrations/twitter/routes"
import integrationsRoutes from "./routes/integrations/routes"
import tableRoutes from "./routes/tables/routes"

import client from "./lib/db";
import { indexOnChainData } from "./indexer";
import { createDeck } from "./lib/flaschards";
import { scrapeGithub } from "./lib/integrations/integrations";
const cron = require('node-cron');
const cors = require("cors");

require('dotenv').config()

const app = express();
app.use(express.json())
const allowedOrigins = ["http://localhost:3000", "http://localhost:19006", "https://u.expo.dev/ffc4f432-c8b6-4087-93b8-db25caadabaa",  "https://u.expo.dev/update/76d0f7b2-e7c8-451b-b6ba-25e1ab456d6f", "*", "http://192.168.1.66.8081:19006", "https://exp+app://expo-development-client/?url=http%3A%2F%2F192.168.1.66%3A8081", "http://u33oacq-ascendmarie-8081.exp.direct"];

// Function to execute query and handle error
function executeQuery(query: string) {
    client.query(query, (err, res) => {
        if (err) throw err;
    });
}

app.use(cors({
    origin: function (origin: any, callback: any) {
        if (!origin) return callback(null, true);
        // if (allowedOrigins.indexOf(origin) === -1) {
        //     var msg = 'The CORS policy for this site does not ' +
        //         'allow access from the specified Origin.';
        //     return callback(new Error(msg), false);
        // }
        // return callback(null, true);
    }
}));

executeQuery(`
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    address TEXT UNIQUE,
    pfp_url TEXT,
    cover_picture_url TEXT,
    description TEXT
);
`)

executeQuery(`
CREATE TABLE IF NOT EXISTS levels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total INTEGER,
    language INTEGER,
    socials INTEGER,
    meditation INTEGER,
    code INTEGER,
    sport INTEGER
);
`)

executeQuery(`
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user1 TEXT,
    user2 TEXT,
    status TEXT
);
`);

// add address
executeQuery(`
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    created TIMESTAMP,
    started TIMESTAMP,
    solanaid INTEGER,
    time INTEGER,
    type TEXT,
    stake INTEGER,
    author TEXT,
    challengedata JSONB
);`);

executeQuery(`
    CREATE TABLE IF NOT EXISTS challenges_players (
        id SERIAL PRIMARY KEY,
        main_id INTEGER REFERENCES challenges(id),
        status TEXT,
        address TEXT,
        nbDone INTEGER
    )
    `);

export const cardsSchema = [
    `
        CREATE TABLE IF NOT EXISTS decks (
            id SERIAL PRIMARY KEY,
            name TEXT,
            tags JSONB,
            columns JSONB
        )
        `,
    `
        CREATE TABLE IF NOT EXISTS cards (
            id SERIAL PRIMARY KEY,
            deck_id SERIAL REFERENCES decks(id) ON DELETE SET NULL 
        )
        `,
    `
        CREATE TABLE IF NOT EXISTS users_cards(
            id SERIAL PRIMARY KEY,
            card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
            user_id SERIAL REFERENCES users(id) ON DELETE SET NULL,
            level INTEGER NOT NULL DEFAULT 0,
            last_updated TIMESTAMP
        )
        `,
    // `ALTER TABLE users_cards ADD CONSTRAINT uc_user_card UNIQUE (user_id, card_id);`
];

const thirdPartyProfiles = `
    CREATE TABLE IF NOT EXISTS app_profiles (
        id SERIAL PRIMARY KEY,
        app_id SERIAL,
        address TEXT REFERENCES users(address) ON DELETE SET NULL,
        username TEXT,
        app TEXT   
    )
`

// const thirdPartyProfiles = `
//     DROP TABLE IF EXISTS app_profiles
// `
executeQuery(thirdPartyProfiles)

cardsSchema.forEach((schema) => executeQuery(schema))

function executeQueryWithParams(query: string, params: any[]) {
    client.query(query, params, (err, res) => {
        if (err) throw err;
    });
}

// const query = `
//     DROP TABLE IF EXISTS users_cards
// `;
// executeQuery(query)

// executeQueryWithParams(query, [JSON.stringify({"deckId": 2, from: "country", to: "capital"}), 14])

app.use('/users', userRoutes);
app.use('/friendships', friendshipsRoutes);
app.use('/challenges', challengesRoutes);
app.use('/flashcards', flashcardsRoutes);
app.use('/integrations', integrationsRoutes);
app.use('/integrations/github', githubRoutes);
app.use('/integrations/farcaster', farcasterRoutes);
app.use('/integrations/farcaster', twitterRoutes);
app.use("/tables", tableRoutes)

cron.schedule('*/10 * * * *', async () => {
    indexOnChainData()
});

// scrapeGithub(`https://raw.githubusercontent.com/asc-end/ascend-backend/commits/main/`)
// createDeck("language", ["language"], data)

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
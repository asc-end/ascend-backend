import express from "express";
import userRoutes from "./routes/users/routes"
import friendshipsRoutes from "./routes/friendships/routes"
import challengesRoutes from "./routes/challenges/routes"
import githubRoutes from "./routes/integrations/github/routes"
import flashcardsRoutes from "./routes/flashcards/routes"
import farcasterRoutes from "./routes/integrations/farcaster/routes"
import client from "./lib/db";
import { indexOnChainData } from "./indexer";
const cron = require('node-cron');
const cors = require("cors");

require('dotenv').config()

const app = express();
app.use(express.json())
const allowedOrigins = ["http://localhost:3000", "http://localhost:19006", "https://u.expo.dev/ffc4f432-c8b6-4087-93b8-db25caadabaa", "*", "http://192.168.1.66.8081:19006", "https://exp+app://expo-development-client/?url=http%3A%2F%2F192.168.1.66%3A8081", "http://u33oacq-ascendmarie-8081.exp.direct"];

app.use(cors({
    origin: function (origin: any, callback: any) {
        if (!origin) return callback(null, false);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

client.query(`
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    address TEXT UNIQUE,
    pfp_url TEXT,
    cover_picture_url TEXT,
    description TEXT
)
`, (err, res) => {
    if (err) throw err;
});

client.query(`
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
`, (err, res) => {
    if (err) throw err;
});

client.query(`
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user1 TEXT,
    user2 TEXT,
    status TEXT
);
`, (err, res) => {
    if (err) throw err;
});

// add address
client.query(`
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
);
`, (err, res) => {
    if (err) throw err;
});

client.query(`
    CREATE TABLE IF NOT EXISTS challenges_players (
        id SERIAL PRIMARY KEY,
        main_id INTEGER REFERENCES challenges(id),
        status TEXT,
        address TEXT,
        nbDone INTEGER
    )
    `, (err, res) => {
    if (err) throw err;
});

client.query(`
CREATE TABLE IF NOT EXISTS languagecards (
    id SERIAL PRIMARY KEY,
    english TEXT,
    french TEXT,
    german TEXT,
    italian TEXT,
    portuguese TEXT,
    spanish TEXT
);
`, (err, res) => {
    if (err) throw err;
});

client.query(`
CREATE TABLE IF NOT EXISTS farcaster_profiles (
    id SERIAL PRIMARY KEY,
    fid INTEGER,
    user_address TEXT REFERENCES users(address) ON DELETE SET NULL,
    UNIQUE(fid, user_address)
);
`, (err, res) => {
    if (err) throw err;
});

// client.query(`
// DROP TABLE IF EXISTS farcaster_profiles;
// `, (err, res) => {
//     if (err) throw err;
//     console.log("Table 'farcaster_profiles' has been deleted.");
// });

app.use('/users', userRoutes);
app.use('/friendships', friendshipsRoutes);
app.use('/challenges', challengesRoutes);
app.use('/flashcards', flashcardsRoutes);
app.use('/integrations/github', githubRoutes);
app.use('/integrations/farcaster', farcasterRoutes);


cron.schedule('*/15 * * * *', async() => {
    indexOnChainData()
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
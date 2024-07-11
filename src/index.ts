import express from "express";

import { client } from "./config";
import { createWebsocket } from "./lib/solana/websocket";
import { challengesRoutes, farcasterRoutes, flashcardsRoutes, friendshipsRoutes, githubRoutes, integrationsRoutes, twitterRoutes, userRoutes } from "./routes";
import { createTables } from "./schema/schema";

const cors = require("cors");

require('dotenv').config()

const app = express();
app.use(express.json())
const allowedOrigins = ["http://localhost:3000", "http://localhost:19006", "https://u.expo.dev/ffc4f432-c8b6-4087-93b8-db25caadabaa", "https://u.expo.dev/update/76d0f7b2-e7c8-451b-b6ba-25e1ab456d6f", "*", "http://192.168.1.66.8081:19006", "https://exp+app://expo-development-client/?url=http%3A%2F%2F192.168.1.66%3A8081", "http://u33oacq-ascendmarie-8081.exp.direct"];

// Function to execute query and handle error
export function executeQuery(query: string) {
    client.query(query, (err, res) => {
        if (err) throw err;
    });
}

export function executeQueryWithParams(query: string, params: any[]) {
    client.query(query, params, (err, res) => {
        if (err) throw err;
    });
}

app.use(cors({
    origin: function (origin: any, callback: any) {
        console.log(origin)
        if (!origin) return callback(null, false);
        // if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

createTables()
createWebsocket()

app.use('/users', userRoutes);
app.use('/friendships', friendshipsRoutes);
app.use('/challenges', challengesRoutes);
app.use('/flashcards', flashcardsRoutes);
app.use('/integrations', integrationsRoutes);
app.use('/integrations/github', githubRoutes);
app.use('/integrations/farcaster', farcasterRoutes);
app.use('/integrations/twitter', twitterRoutes);

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
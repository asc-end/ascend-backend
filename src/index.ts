import express, { Request, Response } from "express";
import userRoutes from "./users/routes"
import friendshipsRoutes from "./friendships/routes"
import challengesRoutes from "./challenges/routes"
import githubRoutes from "./github/routes"
import flashcardsRoutes from "./flashcards/routes"
import client from "./db";
import { Octokit } from "octokit";
import { importFromJson } from "./flashcards/routes";
const cors = require("cors");
require('dotenv').config()

const app = express();
app.use(express.json())
const allowedOrigins = ["http://localhost:3000", "http://localhost:19006", "https://u.expo.dev/ffc4f432-c8b6-4087-93b8-db25caadabaa", "*", "http://192.168.1.66.8081:19006", "https://exp+app://expo-development-client/?url=http%3A%2F%2F192.168.1.66%3A8081"];

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
    address TEXT,
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

client.query(`
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    beginDate NUMBER,
    status STRING,
    length NUMBER,
    nbDone NUMBER,
    type TEXT,
    solStaked NUMBER,
    author STRING,
    players JSON,
    challengeData JSON
);
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

app.use('/users', userRoutes);
app.use('/friendships', friendshipsRoutes);
app.use('/challenges', challengesRoutes);
app.use('/github', githubRoutes);
app.use('/flashcards', flashcardsRoutes);

app.get("/test", (req, res) => {
    res.status(200).json({ "message": "test" });
})

async function setLostChallengesAsFinished() {
    const query = `
            UPDATE challenges 
            SET status = 'finished' 
            WHERE status = 'during' 
            AND beginDate + (nbDone * INTERVAL '1 day') < current_date
            `;
    client.query(query, (err, result) => {
        if (err)
            console.error("Error updating lost challenges", err);
        else if (result)
            console.log("Lost challenges set as finished");
    });
}

async function testCommits() {
    const octokit = new Octokit()
    // Get today's date
    const today = new Date();

    // Subtract one day from today
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    // Format yesterday's date in YYYY-MM-DD format
    const yesterdayFormatted = yesterday.toISOString().slice(0, 10);
    const todayFormatted = today.toISOString().slice(0, 10)

    let codeChallenges: any[] = []

    client.query(`
    SELECT * FROM challenges 
    WHERE type = 'Code' AND status = 'during'
`, (err, res) => {
        if (err) {
            throw err;
        }
        codeChallenges = res.rows
        codeChallenges?.forEach(async (challenge) => {
            console.log(challenge)
            try {
                if (!challenge.challengedata) return
                await octokit.request(`GET /repos/${challenge.challengedata.user}/${challenge.challengedata.repo.name}/commits`, {
                    owner: challenge.challengedata.user,
                    repo: challenge.challengedata.repo.name,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                }).catch(e => {
                    console.error(e)
                    throw (e)
                }).then((r) => {
                    //@ts-ignore

                    if (r.status !== 200) return
                    let commitToday = false
                    //@ts-ignore
                    r.data?.forEach((commit: any) => {
                        const commitDate = commit.commit.committer.date?.slice(0, 10);
                        console.log(commitDate, commit.commit)
                        if (commitDate === yesterdayFormatted) {
                            commitToday = true

                        }
                    });
                    if (!commitToday)
                        console.log("no commit today for ", challenge.challengedata.repo.name)
                    if (commitToday) {
                        const query = "UPDATE challenges SET nbDone = nbDone + 1 WHERE id = $1 AND status = 'during'";
                        client.query(query, [challenge.id], (err, res) => {
                            if (err) {
                                throw err;
                            }
                            console.log('Number done updated successfully!');
                        });

                    }
                })

            } catch (e) {
                console.log(e)
            }
        })
    });


}

testCommits()
const cron = require('node-cron');

cron.schedule('0 1 * * *', async () => {
    await testCommits()
    await setLostChallengesAsFinished()
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
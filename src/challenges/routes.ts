import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const { address } = req.query

        // const query =`SELECT *
        // FROM challenges
        // WHERE EXISTS (
        //   SELECT 1
        //   FROM jsonb_array_elements(players::jsonb) AS p -- Ensuring explicit casting to jsonb
        //   WHERE (p->>'address') = $1

        // );`
        const query = `SELECT 
        c.id, 
        c.beginDate,
        c.status,
        c.length,
        c.nbDone,
        c.type,
        c.solStaked,
        c.challengeData,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                    'userInfo', u.*,
                    'status', p->>'status'
                    )
                )
                FROM jsonb_array_elements(c.players) AS p
                JOIN users u ON u.address = p->>'address'
            ) AS players
        FROM challenges c
        WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements(c.players) AS p
            JOIN users u ON u.address = p->>'address'
            WHERE u.address = $1
    )`

        const challengesQuery = await client.query(query, [address]);


        const challenges = challengesQuery.rows;

        const usersPromises = challenges.map(async (challenge) => {
            const userQuery = await client.query(`SELECT * FROM users WHERE address = $1`, [challenge.author]);
            return userQuery.rows[0];
        });

        const users = await Promise.all(usersPromises);

        // Replace author with user object
        const challengesWithUsers = challenges.map((challenge, index) => {
            return {
                ...challenge,
                author: users[index]
            };
        });
        res.status(200).json(challengesWithUsers);
    }
    catch (err) {
        console.error("Error fetching actual data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.get("/feed", async (req, res) => {
    try {
        const cursorParam = req.query.cursor; // Get cursor from query parameters
        const cursor = typeof cursorParam === 'string' ? parseInt(cursorParam) : 0; // Convert cursor to number, default to 0 if not provided or invalid
        const limit = 10; // Set a limit for the number of challenges per page

        const userAddress = req.query.address;

        console.log(cursor, userAddress)
        // Query to select challenges of friends
        const challengesQuery = await client.query(`
        SELECT 
        c.id, 
        c.beginDate,
        c.status,
        c.length,
        c.nbDone,
        c.type,
        c.solStaked,
        c.challengeData,
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                    'userInfo', u.*,
                    'status', p->>'status'
                    )
                )
                FROM jsonb_array_elements(c.players) AS p
                JOIN users u ON u.address = p->>'address'
            ) AS players
        FROM challenges c
        WHERE EXISTS (
            SELECT 1
            FROM jsonb_array_elements(c.players) AS p
            JOIN users u ON u.address = p->>'address'
            WHERE u.address = $1
    )
        `, [userAddress, cursor, limit]);
        const challenges = challengesQuery.rows;

        const usersPromises = challenges.map(async (challenge) => {
            const userQuery = await client.query(`SELECT * FROM users WHERE address = $1`, [challenge.author]);
            return userQuery.rows[0];
        });

        const users = await Promise.all(usersPromises);

        // Replace author with user object
        const challengesWithUsers = challenges.map((challenge, index) => {
            return {
                ...challenge,
                author: users[index]
            };
        });

        let nextCursor = null;
        if (challenges.length >= limit) {
            // If there are more challenges, set the next cursor as the next sequential number after the last challenge retrieved
            nextCursor = cursor + challenges.length;
        }

        res.json({ challenges: challengesWithUsers, nextCursor });
    } catch (err) {
        console.error("Error fetching actual data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/new", (req, res) => {
    try {

        const { beginDate, type, status, solStaked, length, players, challengeData } = req.body;

        console.log(challengeData, players)
        const jsondata = JSON.stringify(challengeData)
        const jsonplayers = JSON.stringify(players)
        const nbDone = JSON.stringify(new Array(players.length).fill(0))
        
        const query = "INSERT INTO challenges (beginDate, type, status, solStaked, nbDone, length, players, challengeData) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
        client.query(query, [beginDate, type, status, solStaked, nbDone, length, jsonplayers, jsondata], (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }
            res.status(200).json({ message: 'Challenge created successfully.' });
        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }

})

router.post("/validate-day", (req, res) => {
    try {

        const { challengeId } = req.body;

        const query = "UPDATE challenges SET nbdone = nbdone + 1 WHERE id = $1 AND status = 'during'";
        client.query(query, [challengeId], (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }
            res.status(200).json({ message: 'Challenge incremented successfully.' });
        })
    } catch (err) {
        console.error('Error incrementing challenge:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }

})

router.post("/set-done", (req, res) => {
    try {
        const { challengeId, status } = req.body;
        const query = "UPDATE challenges SET status = $2 WHERE id = $1";

        client.query(query, [challengeId, status], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }
            res.status(200).json({ message: 'Challenge updated successfully.' });
        });
    } catch (err) {
        console.error('Error updating challenge:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
});

router.get("/archived", (req, res) => {
    try {
        const { address } = req.query;
        const query = "SELECT * FROM challenges WHERE author = $1 AND status IN ('archived-won', 'archived-lost') ";

        client.query(query, [address], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }
            res.status(200).json(result.rows);
        });
    } catch (err) {
        console.error('Error updating challenge:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
});


export default router 
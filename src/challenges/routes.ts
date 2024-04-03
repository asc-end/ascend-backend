import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const { address } = req.query

        const query = `
            SELECT 
            c.id, 
            c.beginDate,
            c.length,
            c.type,
            c.solStaked,
            c.challengeData,
            json_agg(
                json_build_object(
                    'id', cp.id, 
                    'status', cp.status, 
                    'nbdone', cp.nbdone, 
                    'address', cp.address, 
                    'name', u.name, 
                    'pfp_url', u.pfp_url, 
                    'cover_picture_url', u.cover_picture_url, 
                    'description', u.description
                )
            ) AS players
        FROM 
            challenges c
        JOIN 
            challenges_players cp ON c.id = cp.main_id
        JOIN 
            users u ON u.address = cp.address
        GROUP BY 
            c.id
        HAVING 
            bool_or(u.address = $1)`
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

        const query = `SELECT 
                c.id, 
                c.beginDate,
                c.length,
                c.type,
                c.solStaked,
                c.challengeData,
                json_agg(
                  json_build_object(
                      'id', cp_all.id, 
                      'status', cp_all.status, 
                      'nbdone', cp_all.nbdone, 
                      'address', u_all.address, 
                      'name', u_all.name, 
                      'pfp_url', u_all.pfp_url, 
                      'cover_picture_url', u_all.cover_picture_url, 
                      'description', u_all.description
                  )) AS players
            FROM 
                (
                SELECT distinct c.id
                FROM 
                    challenges c
                JOIN 
                    challenges_players cp ON c.id = cp.main_id
                JOIN 
                    users u ON u.address = cp.address
                JOIN 
                    friendships f ON (f.user1 = $1 AND f.user2 = u.address) OR (f.user1 = u.address AND f.user2 = $1)
                WHERE
                    f.status = 'friends'
                ) sub
            JOIN challenges c ON c.id = sub.id
            JOIN challenges_players cp_all ON c.id = cp_all.main_id
            JOIN users u_all ON u_all.address = cp_all.address
            GROUP BY 
                c.id
                LIMIT $2
        `
        const challengesQuery = await client.query(query, [userAddress, limit]);
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

router.post("/new", (req, res) => {
    try {
        const { begindate, type, solstaked, length, players, challengedata } = req.body;

        const jsondata = JSON.stringify(challengedata)
        const challengeQuery = "INSERT INTO challenges (beginDate, type, solStaked, length, author, challengedata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id"
        client.query(challengeQuery, [begindate, type, solstaked, length, players[0], jsondata], (err, result) => {
            if (err) {
                console.log(err.stack);
                res.status(500).send('Error while creating challenge');
            } else {
                const challengeId = result.rows[0].id;
                const playerChallengeQuery = "INSERT INTO challenges_players (main_id, status, address, nbDone) VALUES ($1, $2, $3, $4)";

                players.forEach((player: string, i: number) => {
                    const playerData = [challengeId, i === 0 ? "during" : "pending", player, 0]; // Update this line based on actual user data structure

                    client.query(playerChallengeQuery, playerData, (err, result) => {
                        if (err) {
                            console.log(err.stack);
                        }
                    });
                });

                res.status(200).send('Challenge and associated players created');
            }
        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }

})

router.post("/accept", (req, res) => {
    try {

        const { challengeId, address } = req.body;

        const query = "UPDATE challenges_players SET status = 'during' WHERE main_id = $1 AND address = $2";
        client.query(query, [challengeId, address], (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }
            res.status(200).json({ message: 'Challenge accepted successfully.' });
        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
})

router.post("/validate-day", (req, res) => {
    try {

        const { challengeId, address, nbDone } = req.body;

        const query = "UPDATE challenges_players SET nbdone = nbdone + 1 WHERE main_id = $1 AND address = $2";
        client.query(query, [challengeId, address], (err, result) => {
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
        const { challengeId, address } = req.body;

        const query = "UPDATE challenges_players SET status='archived' WHERE main_id = $1 AND address = $2 AND nbDone = (SELECT length FROM challenges WHERE id = $1)";        client.query(query, [challengeId, address], (err, result) => {
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



export default router 
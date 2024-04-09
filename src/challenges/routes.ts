import client from "../db";
import express, { Request, Response } from "express";
import { validate } from "../solana/validate";

const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const { address } = req.query
        const query = `
            SELECT 
            c.id, 
            c.beginDate,
            c.time,
            c.type,
            c.stake,
            c.challengeData,
            c.solanaid,
            json_agg(
                json_build_object(
                    'id', cp_all.id, 
                    'status', cp_all.status, 
                    'nbdone', cp_all.nbdone, 
                    'address', cp_all.address, 
                    'name', u_all.name, 
                    'pfp_url', u_all.pfp_url, 
                    'cover_picture_url', u_all.cover_picture_url, 
                    'description', u_all.description) ORDER BY cp_all.id
            ) AS players
        FROM 
            (
            SELECT distinct c.id
            FROM 
                challenges c
            JOIN 
                challenges_players cp ON c.id = cp.main_id
            JOIN 
                users u ON u.address = cp.address
            WHERE 
                cp.address = $1
            ) sub
        JOIN challenges c ON c.id = sub.id
        JOIN challenges_players cp_all ON c.id = cp_all.main_id
        JOIN users u_all ON u_all.address = cp_all.address
        GROUP BY 
            c.id`
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
                c.time,
                c.type,
                c.stake,
                c.challengeData,
                c.solanaid,
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
        const query = `
                SELECT
                challenges.*,
                challenges_players.status,
                challenges_players.address,
                challenges_players.nbDone
            FROM challenges
            INNER JOIN challenges_players ON challenges.id = challenges_players.main_id
            WHERE challenges_players.status IN ('archived-won', 'archived-lost', 'won', 'lost')
                AND challenges_players.address = $1
            `;

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

router.get("/next-id", async (req, res) => {
    try {
        const { address } = req.query;
        console.log("address", address)
        const query = `SELECT MAX(solanaid) FROM challenges WHERE author = $1`;
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
})

router.post("/new", (req, res) => {
    try {
        const { begindate, type, stake, time, players, challengedata, solanaid } = req.body;

        console.log(begindate, type, stake, time, players, challengedata, solanaid)
        const jsondata = JSON.stringify(challengedata)
        const challengeQuery = "INSERT INTO challenges (beginDate, type, stake, time, author, challengedata, solanaid) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id"
        client.query(challengeQuery, [begindate, type, stake, time, players[0], jsondata, solanaid], (err, result) => {
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

                res.status(200).send({ message: 'Challenge and associated players created' });
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

router.post("/validate-day", async (req, res) => {
    try {
        const { challengeId, solanaid, author, address  } = req.body;
        console.log(challengeId, solanaid, author, address)
        let txSuccess = await validate(solanaid, author, address)
        if(!txSuccess)  {
            console.log("TX ERROR")
            return res.status(500).json({error: `Tx didnt land on solana`})
        }
        
        const query = `UPDATE challenges_players
        SET 
            nbDone = nbDone + 1,
            status = CASE 
                WHEN (SELECT time FROM challenges WHERE id = challenges_players.main_id) = nbDone + 1 THEN 'won' 
                ELSE status
            END
        WHERE main_id = $1 AND address = $2`;
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

        const query = `
            UPDATE challenges_players 
            SET status = CASE 
                WHEN status = 'won' THEN 'archived-won'
                WHEN status = 'lost' THEN 'archived-lost'
                ELSE status
            END
            WHERE main_id = $1 AND address = $2
        `;
        client.query(query, [challengeId, address], (err, result) => {
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
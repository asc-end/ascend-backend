import client from "../../config/db";
import express from "express";
import { validate } from "../../lib/solana/validate";
import { archiveChallenge } from "../../lib/challenges";
const router = express.Router();

router.get("/", async (req, res) => {
    try {

        const { address } = req.query
        const query = `
            SELECT 
            c.id, 
            c.started,
            c.time,
            c.state,
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
                    'description', u_all.description,
                    'target', cp_all.target,
                    'user_name', cp_all.user_name
                ) ORDER BY cp_all.id
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
                cp.address = $1 AND cp.status != "archived-won" AND cp.status != "archived-lost"
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
        const limit = 20; // Set a limit for the number of challenges per page

        const userAddress = req.query.address;

        console.log(cursor, userAddress)
        // Query to select challenges of friends
        const query = `
        SELECT 
            challenges.id,
            started AS event_date,
            'begin' AS event_type,
            solanaid,
            time,
            type,
            state::text,  -- Cast state to text
            stake,
            author,
            challengedata,
            json_agg(
                json_build_object(
                    'id', cp.id, 
                    'status', cp.status, 
                    'nbdone', cp.nbdone, 
                    'address', u.address, 
                    'name', u.name, 
                    'pfp_url', u.pfp_url, 
                    'cover_picture_url', u.cover_picture_url, 
                    'description', u.description
                )
            ) AS players
        FROM 
            challenges
        INNER JOIN friendships ON (friendships.user1 = challenges.author AND friendships.user2 = $2) OR (friendships.user1 = $2 AND friendships.user2 = challenges.author)
        INNER JOIN challenges_players cp ON challenges.id = cp.main_id
        INNER JOIN users u ON u.address = cp.address
        WHERE 
            friendships.status = 'friends' AND
            started <= NOW()
        GROUP BY 
            challenges.id,
            event_date,
            event_type,
            solanaid,
            state,
            time,
            type,
            stake,
            author,
            challengedata
        UNION ALL
        SELECT 
            challenges.id,
            started + INTERVAL '1 day' * time AS event_date,
            'end' AS event_type,
            solanaid,
            state::text,  -- Cast state to text
            time,
            type,
            stake,
            author,
            challengedata,
            json_agg(
                json_build_object(
                    'id', cp.id, 
                    'status', cp.status, 
                    'nbdone', cp.nbdone, 
                    'address', u.address, 
                    'name', u.name, 
                    'pfp_url', u.pfp_url, 
                    'cover_picture_url', u.cover_picture_url, 
                    'description', u.description
                )
            ) AS players
        FROM 
            challenges
        INNER JOIN friendships ON (friendships.user1 = challenges.author AND friendships.user2 = $2) OR (friendships.user1 = $2 AND friendships.user2 = challenges.author)
        INNER JOIN challenges_players cp ON challenges.id = cp.main_id
        INNER JOIN users u ON u.address = cp.address
        WHERE 
            friendships.status = 'friends' AND
            (started + INTERVAL '1 day' * time) <= NOW() AND
            NOT EXISTS (
                SELECT 1 FROM challenges_players 
                WHERE main_id = challenges.id AND status = 'pending'
            )
        GROUP BY 
            challenges.id,
            event_date,
            event_type,
            solanaid,
            state,
            time,
            type,
            stake,
            author,
            challengedata
        ORDER BY 
            event_date DESC
        LIMIT $1
        `
        const challengesQuery = await client.query(query, [limit, userAddress]);
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

router.post("/new", async (req, res) => {
    try {
        const { begindate, type, stake, time, players, challengedata, solanaid } = req.body;

        const jsondata = JSON.stringify(challengedata)
        const challengeQuery = "INSERT INTO challenges (started, type, stake, time, author, challengedata, solanaid) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id"
        client.query(challengeQuery, [begindate, type, stake, time, players[0], jsondata, solanaid], (err, result) => {
            if (err) {
                console.log(err.stack);
                res.status(500).send('Error while creating challenge');
            } else {
                const challengeId = result.rows[0].id;
                const playerChallengeQuery = "INSERT INTO challenges_players (main_id, status, address, nbDone, user_name, target) VALUES ($1, $2, $3, $4, $5, $6)";

                players.forEach((player: string, i: number) => {
                    const playerData = [challengeId, i === 0 ? "during" : "pending", player, 0, i === 0 && challengedata.user, i === 0 && challengedata.target];

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

        const { challengeId, address, user, target } = req.body;

        const query = "UPDATE challenges_players SET status = 'during', user = $3, target = $4 WHERE main_id = $1 AND address = $2";
        client.query(query, [challengeId, address, user, target], (err, result) => {
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
        const { challengeId, solanaid, author, address } = req.body;
        console.log(challengeId, solanaid, author, address)
        let txSuccess = await validate(solanaid, author, address)
        if (!txSuccess) {
            console.log("TX ERROR")
            return res.status(500).json({ error: `Tx didnt land on solana` })
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

router.post("/archive", async (req, res) => {
    try {
        const { challengeId, address } = req.body;

        await archiveChallenge(challengeId, address);
        res.status(200).json({ message: 'Challenge updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: `Internal server error ${err}` });
    }
});


router.post("/set-done", async (req, res) => {
    try {
        const { challengeId, address } = req.body;

        await archiveChallenge(challengeId, address);

        res.status(200).json({ message: 'Challenge updated successfully.' });
    } catch (err) {
        console.error('Error updating challenge:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
});

export default router 
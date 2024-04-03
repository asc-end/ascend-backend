import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req, res) => {
    if (req.query.user)
        client.query(`SELECT * FROM friendships user1 = $1 OR user2 =$1`, [req.query.user], (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ ok: false, error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        });
    else
        client.query(`SELECT * FROM friendships`, (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ ok: false, error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        });
})

router.get("/not-friends", (req, res) => {
    try {
        const query = `
            SELECT
                u.*,
                    CASE
                        WHEN f.user1 = $1 AND f.status = 'pending' AND f.user2 = u.address THEN 'request'
                        WHEN f.user2 = $1 AND f.status = 'pending' AND f.user1 = u.address THEN 'invite'
                        WHEN f.status = 'friends' THEN 'friends'
                        ELSE 'unknown'
                    END AS status,
                    f.id AS friendship_id
                FROM
                    users u
                LEFT JOIN
                    friendships f ON (f.user1 = $1 AND f.user2 = u.address) OR (f.user2 = $1 AND f.user1 = u.address)
                WHERE
                    u.address != $1
                    AND ((f.status IS NULL) OR (f.status NOT IN ('friends')));
            `
        client.query(query, [req.query.address], (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ ok: false, error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        });
    }
    catch (e) {
        res.status(500).json({ ok: false, erro: "Internal server error" })
    }
})


router.get("/friends", (req, res) => {
    const query = `
    SELECT
    u.*,
    CASE
        WHEN f.user1 = $1 AND f.status = 'pending' AND f.user2 = u.address THEN 'request'
        WHEN f.user2 = $1 AND f.status = 'pending' AND f.user1 = u.address THEN 'invite'
        WHEN f.status = 'friends' THEN 'friends'
        WHEN f.status IS NULL THEN 'none'
        ELSE f.status
    END AS status,
    f.id AS friendship_id
FROM
    users u
LEFT JOIN
    friendships f ON (f.user1 = $1 AND f.user2 = u.address) OR (f.user2 = $1 AND f.user1 = u.address)
WHERE
    u.address != $1;
    `
    client.query(query, [req.query.address], (err, result) => {
        if (err) {
            console.error("Error fetching actual data:", err);
            res.status(500).json({ ok: false, error: "Internal server error" });
        } else {
            res.json(result.rows);
        }
    });
})

router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM friendships WHERE id = $1 RETURNING *";
    client.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting friendship:', err);
            res.status(500).json({ ok: false, error: 'Internal server error' });
        } else if (result.rows.length === 0) {
            res.status(404).json({ error: 'Friendship not found' });
        } else {
            res.json({ message: 'Friendship deleted successfully', deletedFriendship: result.rows[0] });
        }
    });
});

router.post("/accept", (req, res) => {
    const { id } = req.query;
    const query = "UPDATE friendships SET status = 'friends' WHERE id = $1 RETURNING *";
    client.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error updating friendship status:', err);
            res.status(500).json({ ok: false, error: 'Internal server error' });
        } else if (result.rows.length === 0) {
            res.status(404).json({ error: 'Friendship not found' });
        } else {
            res.json({ message: 'Friendship accepted successfully', updatedFriendship: result.rows[0] });
        }
    });
})

router.post("/", (req, res) => {
    try {
        const { user1, user2 } = req.body;
        const query = "INSERT INTO friendships (user1, user2, status) VALUES ($1, $2, 'pending')"
        client.query(query, [user1, user2], (err, result) => {
            if (err) {
                console.error('Error inserting friendship:', err);
                res.status(500).json({ ok: false, error: 'Internal server error' });
                return;
            }

        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
})

export default router 

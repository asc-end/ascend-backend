import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req, res) => {
    if (req.query.user)
        client.query(`SELECT * FROM friendships user1 = $1 OR user2 =$1`, [req.query.user], (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        });
    else
        client.query(`SELECT * FROM friendships`, (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        });
})

router.get("/pending", (req, res) => {
    const query = `
    SELECT u.*, f.id AS friendship_id, u.id AS user_id,
    CASE 
        WHEN u.address = f.user1 THEN 'request' 
        WHEN u.address = f.user2 THEN 'invite' 
    END as status
    FROM friendships f
    JOIN users u ON u.address = f.user1 OR u.address = f.user2
    WHERE (f.user1 = $1 OR f.user2 = $1) AND f.status = 'pending'
`;
    client.query(query, [req.query.address], (err, result) => {
        if (err) {
            console.error("Error fetching actual data:", err);
            res.status(500).json({ error: "Internal server error" });
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
            res.status(500).json({ error: 'Internal server error' });
        } else if (result.rows.length === 0) {
            res.status(404).json({ error: 'Friendship not found' });
        } else {
            res.json({ message: 'Friendship deleted successfully', deletedFriendship: result.rows[0] });
        }
    });
});


router.post("/", (req, res) => {
    try {
        const { user1, user2 } = req.body;
        const query = "INSERT INTO friendships (user1, user2, status) VALUES ($1, $2, 'pending')"
        client.query(query, [user1, user2], (err, result) => {
            if (err) {
                console.error('Error inserting friendship:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

export default router 

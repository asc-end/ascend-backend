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

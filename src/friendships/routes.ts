import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req, res) => {
    client.query(`SELECT * FROM friendships user1 = $1 OR user2 =$1`, [req.query.user], (err, result) => {
        if (err) {
            console.error("Error fetching actual data:", err);
            res.status(500).json({ error: "Internal server error" });
        } else {
            res.json(result.rows);
        }
    });
})

export default router 

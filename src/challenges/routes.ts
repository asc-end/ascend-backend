import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req, res) => {
    client.query(`SELECT * FROM challenges`, (err, result) => {
        if (err) {
            console.error("Error fetching actual data:", err);
            res.status(500).json({ error: "Internal server error" });
        } else {
            res.json(result.rows);
        }
    });
})

router.post("/new", (req, res) => {
    try {

        const { beginDate, type, status, author, solStaked, nbDone, length, players, challengeData } = req.body;

        console.log(beginDate, type, status, author, solStaked, nbDone, length, players, challengeData)
        const query = "INSERT INTO challenges (beginDate, type, status, author, solStaked, nbDone, length, players, challengeData) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"
        client.query(query, [beginDate, type, status, author, solStaked, nbDone, length, players, challengeData], (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }

        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }

})

export default router 

import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req, res) => {
    const {address} = req.query

    client.query(`SELECT * FROM challenges WHERE players::text LIKE '%' || $1 || '%' OR author = $1`, [address], (err, result) => {
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

        console.log(challengeData, players)
        const jsondata = JSON.stringify(challengeData)
        const jsonplayers = JSON.stringify(players)
        console.log(beginDate, type, status, author, solStaked, nbDone, length, players, challengeData)
        const query = "INSERT INTO challenges (beginDate, type, status, author, solStaked, nbDone, length, players, challengeData) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)"
        client.query(query, [beginDate, type, status, author, solStaked, nbDone, length, jsonplayers, jsondata], (err, result) => {
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

export default router 

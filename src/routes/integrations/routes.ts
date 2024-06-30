import client from "../../lib/db";
import express, { Request, Response } from "express";

const router = express.Router();


router.get("/user", async (req, res) => {
    try {
        const { address } = req.query
        if (!address) return res.status(400).json({ error: "Please provide an address." })

        const query = `SELECT * FROM app_profiles WHERE address = $1`;

        client.query(query, [address], async (err, result) => {
            if (err) throw Error("no linked profile")

            if (result.rows.length == 0)
                return res.status(200).json({ users: [] })

            // const users:User[] = (await neynarClient.fetchBulkUsers(result.rows.map(r => r.fid))).users
            res.status(200).json({ users: result.rows });
        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
})

export default router 

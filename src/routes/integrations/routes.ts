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

router.delete("/user", async (req, res) => {
    try {
        const { address, app } = req.query
        if (!address) return res.status(400).json({ error: "Please provide an address." })

        // Change the query to delete the user with the provided address
        const query = `DELETE FROM app_profiles WHERE address = $1 AND app = $2`;

        client.query(query, [address, app], async (err, result) => {
            if (err) throw Error("Failed to delete profile")

            // If no rows were affected, the user was not found
            if (result.rowCount == 0)
                return res.status(404).json({ error: "User not found" })

            res.status(200).json({ message: "User deleted successfully" });
        })
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }  
})

export default router 

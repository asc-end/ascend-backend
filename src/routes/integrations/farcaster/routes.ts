
import express, { Request, Response } from "express";
import client from "../../../lib/db";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import neynarClient from "../../../lib/neynar";
const router = express.Router();

const appClient = createAppClient({
    relay: 'https://relay.farcaster.xyz',
    ethereum: viemConnector(),
});

router.get("/test", (req, res) => {
    res.status(200).json({ message: "Good test" })
})

router.post("/link", async (req, res) => {
    try {
        const { domain, message, nonce, signature, address } = req.body;

        const resp = await appClient.verifySignInMessage({ domain, message, nonce, signature })
        // const { challengeId, address } = req.body;

        if (!resp.success)
            return res.status(400).json({ error: "Invalid signature." })

        const query = "INSERT INTO farcaster_profiles (user_address, fid) VALUES ($1, $2)";
        client.query(query, [address, resp.fid], (err, result) => {
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

router.get("/user", async (req, res) => {
    try {
        const address = req.query.address
        if (!address) return res.status(400).json({ error: "Please provide an address." })

        const query = "SELECT * FROM farcaster_profiles WHERE user_address = $1";

        client.query(query, [address,], async (err, result) => {
            if (err) {
                throw Error("no linked farcaster")
            }

            const users = (await neynarClient.fetchBulkUsers(result.rows.map(r => r.fid))).users
            res.status(200).json({ users: users });
        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
})

router.delete("/user", async (req, res) => {
    try {
        const { fid } = req.body;
        if (!fid) return res.status(400).json({ error: "Please provide a fid." });

        const query = "DELETE FROM farcaster_profiles WHERE fid = $1";

        client.query(query, [fid], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }
            res.status(200).json({ message: 'User deleted successfully.' });
        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
})

export default router 

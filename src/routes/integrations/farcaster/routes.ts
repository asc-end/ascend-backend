
import express from "express";
import {client, appClient, neynarClient} from "../../../config";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { validateDay } from "../../../lib/integrations/integrations";
import { createFcWebhook } from "../../../lib/integrations/farcaster";
const router = express.Router();

router.post("/create", async (req, res) => {
    try {
        const { domain, message, nonce, signature, address, username } = req.body;

        const resp = await appClient.verifySignInMessage({ domain, message, nonce, signature })
        // const { challengeId, address } = req.body;

        if (!resp.success)
            return res.status(400).json({ error: "Invalid signature." })

        // Check if profile already exists
        const checkQuery = "SELECT * FROM app_profiles WHERE address = $1 AND app = 'Farcaster'";
        client.query(checkQuery, [address], (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }

            // If profile exists, return the id
            if (result.rows.length > 0) {
                res.status(200).json({ message: 'Farcaster profile already exists.', fid: result.rows[0].fid });
                return;
            }

            // If profile doesn't exist, insert new profile
            const insertQuery = "INSERT INTO app_profiles (address, app_id, username, app) VALUES ($1, $2, $3, 'Farcaster') RETURNING app_id";
            client.query(insertQuery, [address, resp.fid, username], (err, result) => {
                if (err) {
                    console.error(err)
                    res.status(500).json({ error: `Internal server error : ${err.message}` });
                    return;
                }
                res.status(200).json({ message: 'Farcaster linked successfully.', appId: result.rows[0].app_id });
            })
        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
})

router.get("/user", async (req, res) => {
    try {
        console.log("USER")
        const address = req.query.address
        if (!address) return res.status(400).json({ error: "Please provide an address." })

        const query = "SELECT * FROM app_profiles WHERE address = $1 AND app = 'Farcaster'";

        client.query(query, [address,], async (err, result) => {
            if (err) throw Error("no linked farcaster")
            if (result.rows.length == 0) return res.status(200).json({ users: [] })
            const users: User[] = (await neynarClient.fetchBulkUsers(result.rows.map(r => r.app_id))).users
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
            if (err) throw Error(err.message);
            res.status(200).json({ message: 'User deleted successfully.' });
        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
})

router.post("/webhook", async (req, res) => {
    try {
        const { fid, challengeId } = req.body
        let resp = await createFcWebhook(fid)
        res.status(200).json(resp)
    } catch (e) {
        res.status(500).json({ error: e })
    }
})

router.post("/webhook/cast", async (req, res) => {
    try {
        const fid = req.body.data.author.fid;

        let resp = await validateDay("Farcaster", fid, req.body.timestamp)
        res.status(200).json({ message: resp })

    } catch (e) { res.status(500).json({ error: e }) }
})

export {router as farcasterRoutes} 

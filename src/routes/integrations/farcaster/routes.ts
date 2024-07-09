
import express, { Request, Response } from "express";
import client from "../../../lib/db";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import neynarClient from "../../../lib/neynar";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { validate } from "../../../lib/solana/validate";
import { getDayWindow } from "../../../lib/challenges";
import dayjs from "dayjs";
const router = express.Router();

export const appClient = createAppClient({
    relay: 'https://relay.farcaster.xyz',
    ethereum: viemConnector(),
});

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

router.post("/webhook", async (req, res) => {
    try {
        const { fid, challengeId } = req.body

        const webhookUrl = "https://ascend-backend-production.up.railway.app/integrations/farcaster/webhook/cast"

        const url = 'https://api.neynar.com/v2/farcaster/webhook';
        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                api_key: process.env.NEYNAR_API_KEY!!,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                subscription: { 'cast.created': { author_fids: [fid] } },
                name: `Ascend-Challenge-${challengeId}`,
                url: webhookUrl
            })
        };

        fetch(url, options)
            .then(res => res.json())
            .then(json => {
                console.log(json)
                res.status(200).json("Webhook created successfully")
            })
    } catch (e) {
        res.status(500).json({ error: e })
    }
})

router.post("/webhook/cast", (req, res) => {
    try {
        const fid = req.body.fid;

        console.log(req.body)
        const challengeQuery = `
        SELECT cp.*, u.address AS user_address, c.author AS author_address, c.solanaid, c.started
            FROM challenges_players cp
            JOIN users u ON cp.address = u.address
            JOIN challenges c ON cp.main_id = c.id
            WHERE cp.target = $1 AND cp.user_name = $2
        `;

        client.query(challengeQuery, ["Farcaster", fid], async (err, challengeResult) => {
            if (err)
                return res.status(500).json({ error: `Internal server error : ${err.message}` });
            if (challengeResult.rows.length === 0)
                return res.status(404).json({ message: "No pending challenge found" });

            const currentChallenge = challengeResult.rows[0];
            const {startOfWindow, endOfWindow } = getDayWindow(currentChallenge.started)
            console.log(startOfWindow, endOfWindow,dayjs(req.body.timestamp).isAfter(startOfWindow) && dayjs(req.body.timestamp).isBefore(endOfWindow), dayjs(req.body.timestamp).toString())
            if (dayjs(req.body.timestamp).isAfter(startOfWindow) && dayjs(req.body.timestamp).isBefore(endOfWindow)) {
                let resp = await validate(currentChallenge.solanaid, currentChallenge.author_address, currentChallenge.user_address)
                if (!resp) throw Error()

            } else {
                throw Error()
            }

            res.status(200).json({ message: "Successfully validated day." })
        });
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: e })
    }
})

export default router 

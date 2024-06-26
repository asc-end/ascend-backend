import express, { Request, Response } from "express";
import { Octokit } from "octokit";

let createOAuthUserAuth: any;

import("@octokit/auth-oauth-user").then((module) => {
    createOAuthUserAuth = module.createOAuthUserAuth;
});

import axios from "axios";
import jwt from "jsonwebtoken"
import client from "../../../lib/db";
import { setDayDone } from "../../../lib/challenges";
import { getInstallation } from "../../../lib/integrations/github";
const router = express.Router();

router.get("/repo", async (req, res) => {
    try {
        let { token, page } = req.query
        if (!token) return

        const octokit = new Octokit({
            auth: token,
        });
        if (!page) page = "1"

        const installation = await getInstallation(token?.toString())
        if (!installation) return
        console.log(installation[0].id)
        const result = await octokit.request(`GET /user/installations/{installation_id}/repositories`, {
            installation_id: installation[0].id,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            }
        })
        console.log(result)
        return res.status(200).json(result)
    } catch (e) {
        return res.status(500).json({ error: e })
    }
})

router.post("/create", async (req, res) => {
    try {
        const { address, username, id } = req.body;

        // Check if profile already exists
        const checkQuery = "SELECT * FROM app_profiles WHERE address = $1 AND app = 'Github'";
        client.query(checkQuery, [address], (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }

            // If profile exists, return the id
            if (result.rows.length > 0) {
                res.status(200).json({ message: 'Github profile already exists.', fid: result.rows[0].fid });
                return;
            }

            // If profile doesn't exist, insert new profile
            const insertQuery = "INSERT INTO app_profiles (address, app_id, username, app) VALUES ($1, $2, $3, 'Github') RETURNING app_id";
            client.query(insertQuery, [address, id, username], (err, result) => {
                if (err) {
                    console.error(err)
                    res.status(500).json({ error: `Internal server error : ${err.message}` });
                    return;
                }
                res.status(200).json({ message: 'Github linked successfully.', appId: result.rows[0].app_id });
            })
        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
})

router.post("/webhook", async (req, res) => {
    try {
        const { token, owner, repo } = req.body

        console.log(token, owner, repo)
        if (!owner || !repo) return
        const octokit = new Octokit({
            auth: token,
        });

        const resp = await octokit.request('POST /repos/{owner}/{repo}/hooks', {
            owner: owner.toString(),
            repo: repo.toString(),
            name: 'web',
            active: true,
            events: ['push'],
            config: {
                url: "https://ascend-backend-production.up.railway.app/integrations/github/webhook/commit",
                content_type: 'json',
                insecure_ssl: '0'
            },
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        console.log(resp)
        res.status(200).json(resp)

    } catch (e) {
        res.status(500).json({ error: e })
    }
})

router.delete("/webhook", async (req, res) => {
    try {

    } catch (e) {
        res.status(500).json({ error: e })
    }  
})

router.get("/revoke", (req, res) => {
    const { token } = req.query
    const octokit = new Octokit({
        authStrategy: createOAuthUserAuth,
        auth: { clientId: process.env.GH_CLIENT_ID, clientSecret: process.env.GH_CLIENT_SECRET }
    });

    octokit.rest.apps.checkToken({ access_token: token as string, client_id: process.env.GH_CLIENT_ID as string })
        .then(resp => console.log(resp))
        .catch(e => {
            if (e.status == 404) {
                res.status(200).json("Token already not linked")
            }
        })
    octokit.request(`DELETE /applications/${process.env.GH_CLIENT_ID}/grant`, { access_token: token }).then((result) => {
        console.log(result)
        res.status(200).json("Authorization revoked properly")
    }).catch((e) => res.status(500).json(`An error occured while revoking: ${e}`))
})

router.post("/webhook/commit", (req, res) => {
    try {

        console.log("GITHUB WEBOOK POST")

        // Extract necessary data from the request
        const username = req.body.pusher?.name;
        const repoId = req.body.repository.id;

        if(!username) return res.status(200).json({message: "Not a push event"})
        console.log(repoId, username)
        const query =
            `UPDATE challenges_players
        SET 
        nbDone = nbDone + 1,
        status = CASE 
        WHEN (SELECT time FROM challenges WHERE id = challenges_players.main_id) = nbDone + 1 THEN 'won' 
        ELSE status
            END
            WHERE target = $1 AND user_name = $2 AND status = pending`;

        client.query(query, [repoId, username], (err, result) => {
             console.log(result)
             console.log(err)
             res.status(200).json(result)
        })
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: e })
    }
})


export default router 

import express from "express";
import { Octokit } from "octokit";

let createOAuthUserAuth: any;

import("@octokit/auth-oauth-user").then((module) => {
    createOAuthUserAuth = module.createOAuthUserAuth;
});
import { client } from "../../../config";
import { createGhWebhook, getInstallation } from "../../../lib/integrations/github";
import { validateDay } from "../../../lib/integrations/integrations";
const router = express.Router();

router.get("/repo", async (req, res) => {
    try {
        let { token, page } = req.query
        if (!token) return

        const octokit = new Octokit({ auth: token });
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
        if (!owner || !repo) return

        const resp = await createGhWebhook(token, owner, repo)
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

router.post("/webhook/commit", async (req, res) => {
    try {
        const username = req.body.pusher.name;
        const repoId = req.body.repository.id;


        console.log(req.body)
        if (!username) return res.status(200).json({ message: "Not a push event" })

        let resp = await validateDay(repoId, username, req.body.head_commit.timestamp)
        res.status(200).json({ message: resp })
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: e })
    }
})


export { router as githubRoutes }

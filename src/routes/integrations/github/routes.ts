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
    let { token, page } = req.query
    if (!token) return

    const octokit = new Octokit({
        auth: token,
    });
    if (!page) page = "1"

    const installation = await getInstallation(token?.toString())
    if (!installation) return
    const result = octokit.request(`GET /installations/${installation[0].id}/repositories?per_page=100&page${page}`, {
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'Authorization': `token ${token}`,
        }
    }).then((result) => { res.status(200).json(result) })
        .catch(e => res.status(500).json({ error: e }))
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

const redirectURI = 'https://b502-217-165-96-123.ngrok-free.app/github/callback';

router.get('/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GH_CLIENT_ID,
            client_secret: process.env.GH_CLIENT_SECRET,
            code,
            redirect_uri: redirectURI
        }, {
            headers: { 'Accept': 'application/json' }
        });

        const { access_token } = tokenResponse.data;

        // Fetch user data from GitHub
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const userData = userResponse.data;

        // Generate JWT token or handle session as per your application's requirement
        const jwtToken = jwt.sign(userData, 'your_jwt_secret');

        res.status(200).json({ token: jwtToken, user: userData });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.get('/auth', (req, res) => {
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GH_CLIENT_ID}&redirect_uri=${redirectURI}`;
    res.redirect(githubAuthURL);
});


router.get('/commit', (req, res) => {
    const octokit = new Octokit()
    const today = new Date().toISOString().slice(0, 10);


    octokit.request('GET /repos/mgavillo/dslr/commits', {
        owner: 'mgavillo',
        repo: 'dslr',
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    }).catch(e => {
        res.status(500).json(`Failed : ${e}`)
    }).then((r) => {

        let commitToday = false
        //@ts-ignore
        r.data?.forEach((commit: any) => {
            const commitDate = commit.committer.date?.slice(0, 10);
            if (commitDate === today) {
                commitToday = true
            }
        });
        res.status(200).json(commitToday)
    })
})


router.get("/webhook/commit", (req, res) => {
    console.log("GITHUB WEBOOK GET")
    console.log(req)
    res.status(200).json({ message: "All good" })
})

router.get('/installations', async (req, res) => {
    try {

        const { token } = req.query

        console.log(token)
        const octokit = new Octokit({
            auth: token
        })

        const resp = await octokit.request('GET /user/installations', {
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        res.status(200).json(resp)
    } catch (e) {
        res.status(500).json(e)
    }
})

router.get('/repositories', async (req, res) => {
    try {

        const { token } = req.query

        console.log(token)
        const octokit = new Octokit({
            appId: process.env.APP_ID,
            privateKey: process.env.PRIVATE_KEY,
        })

        const resp = await octokit.request(`GET /user/installations/52387571/repositories`, {
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        res.status(200).json(resp)
    } catch (e) {
        res.status(500).json(e)
    }
})

router.post("/webhook/commit", (req, res) => {
    try {

        console.log("GITHUB WEBOOK POST")
        console.log(req)

        // Extract necessary data from the request
        const username = req.body.pusher.name;
        const repoId = req.body.repository.id;

        const query =
            `UPDATE challenges_players
        SET 
        nbDone = nbDone + 1,
        status = CASE 
        WHEN (SELECT time FROM challenges WHERE id = challenges_players.main_id) = nbDone + 1 THEN 'won' 
        ELSE status
            END
            WHERE target = $1 AND user = $2 AND status = pending`;

        client.query(query, [repoId, username], (err, result) => {

        })
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: e })
    }
})


export default router 

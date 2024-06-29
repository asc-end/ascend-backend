import express, { Request, Response } from "express";
import { Octokit } from "octokit";

let createOAuthUserAuth:any;

import("@octokit/auth-oauth-user").then((module) => {
    createOAuthUserAuth = module.createOAuthUserAuth;
});

import axios from "axios";
import jwt from "jsonwebtoken"
const router = express.Router();

router.get("/repo", (req, res) => {
    const { token } = req.query

    console.log("getting repo")
    const octokit = new Octokit({
        auth: token,
    });

    const result = octokit.request('GET /user/repos', {
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    }).then((result) => {
        console.log(result)

        res.status(200).json(result)
    }).catch(e => res.status(500).json({ error: e }))
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

export default router 

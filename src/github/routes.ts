import express, { Request, Response } from "express";
import { Octokit } from "octokit";
import { createOAuthUserAuth } from "@octokit/auth-oauth-user";
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
        auth: {clientId: process.env.GH_CLIENT_ID, clientSecret: process.env.GH_CLIENT_SECRET}
    });

    octokit.request(`DELETE /applications/${process.env.GH_CLIENT_ID}/grant`, { access_token: token }).then((result) => {
        console.log(result)
        res.status(200).json("Authorization revoked properly")
    }).catch((e) => res.status(500).json(`An error occured while revoking: ${e}`))
})

export default router 

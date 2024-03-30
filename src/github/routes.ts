import express, { Request, Response } from "express";
import { Octokit } from "octokit";

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

router.post("/revoke", (req, res) => {
    const { token } = req.query
    const octokit = new Octokit({
        auth: token,
    });

    octokit.rest.apps.deleteAuthorization({
        client_id: "d42d5aa2eacfe82135e7",
        access_token: token as string,
    }).then((result) => {
        console.log(result)
        res.status(200).json("Authorization revoked properly")
    }).catch((e) => res.status(500).json(`An error occured while revoking: ${e}`))


})

export default router 

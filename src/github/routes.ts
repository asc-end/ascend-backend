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

export default router 

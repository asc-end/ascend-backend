import { Octokit } from "@octokit/core";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/repo", (req, res) => {
    const { token } = req.query

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

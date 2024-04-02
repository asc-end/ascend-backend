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

    octokit.rest.apps.checkToken({access_token: token as string, client_id: process.env.GH_CLIENT_ID as string})
        .then(resp=> console.log(resp))
        .catch(e => {
            if(e.status == 404){
                res.status(200).json("Token already not linked")
            }
        })
    octokit.request(`DELETE /applications/${process.env.GH_CLIENT_ID}/grant`, { access_token: token }).then((result) => {
        console.log(result)
        res.status(200).json("Authorization revoked properly")
    }).catch((e) => res.status(500).json(`An error occured while revoking: ${e}`))
})

router.get('/commit', (req, res)=> {
    const octokit = new Octokit()
    const today = new Date().toISOString().slice(0, 10);


    octokit.request('GET /repos/mgavillo/dslr/commits', {
        owner: 'mgavillo',
        repo: 'dslr',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }).catch(e=> {
        res.status(500).json(`Failed : ${e}`)
    }).then((r)=> {

        let commitToday = false
        //@ts-ignore
        r.data?.forEach((commit:any) => {
            const commitDate = commit.committer.date?.slice(0, 10);
            if (commitDate === today) {
                commitToday = true
            }
        });
        res.status(200).json(commitToday)
    })
})

export default router 
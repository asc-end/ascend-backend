import { Octokit } from "octokit";

export async function getInstallation(token: string){
    const octokit = new Octokit({
        auth: token,
    });

    return octokit.request(`GET /user/installations`, {
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'Authorization': `token ${token}`,

        }
    }).then((r) => r.data.installations).catch(e => console.log(e))
}
import { Octokit } from "octokit";

export async function getInstallation(token: string) {
    const octokit = new Octokit({ auth: token });

    return octokit.request(`GET /user/installations`, {
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
            'Authorization': `token ${token}`,

        }
    }).then((r) => r.data.installations).catch(e => console.log(e))
}

async function getGhWebhooks(user: string, repo: string) {
    try {

        const octokit = new Octokit({ auth: 'YOUR-TOKEN' })

        return await octokit.request(`GET /repos/{owner}/{repo}/hooks`, {
            owner: user,
            repo: repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        }).then((r) => {
            if (r.status !== 200) throw Error("Error")
            return r.data
        })
    } catch (e) {
        console.log(e)
        throw Error(e as any)
    }
}

export async function deleteGhWebhook(user: string, repo: string) {
    try {
        const webhooks = await getGhWebhooks(user, repo)

        for (const webhook of webhooks) {
            const octokit = new Octokit({ auth: 'YOUR-TOKEN' })

            await octokit.request('DELETE /repos/{owner}/{repo}/hooks/{hook_id}', {
                owner: user,
                repo: repo,
                hook_id: webhook.id,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })
        }
    } catch (e) {
        throw Error(e as any)
    }
}

export async function createGhWebhook(token: string, owner: string, repo: string) {
    try {

        const octokit = new Octokit({ auth: token });

        return await octokit.request('POST /repos/{owner}/{repo}/hooks', {
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
    }
    catch (e) {
        console.log(e)
    }
}
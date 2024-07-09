import { Helius, Address } from "helius-sdk";
const helius = new Helius(process.env.HELIUS_API_KEY!!);

export async function watchAddress(address: string) {
    await helius.appendAddressesToWebhook(process.env.HELIUS_WEBHOOK_ID!!, [address]);
}

export async function forgetAddress(address: string){
    await helius.removeAddressesFromWebhook(process.env.HELIUS_WEBHOOK_ID!!, [address]);
}

// await octokit.request('POST /repos/{owner}/{repo}/hooks', {
//     owner: 'OWNER',
//     repo: 'REPO',
//     name: 'web',
//     active: true,
//     events: [
//         'push',
//         'pull_request'
//     ],
//     config: {
//         url: 'https://example.com/webhook',
//         content_type: 'json',
//         insecure_ssl: '0'
//     },
//     headers: {
//         'X-GitHub-Api-Version': '2022-11-28'
//     }
// })

// await octokit.request('DELETE /repos/{owner}/{repo}/hooks/{hook_id}', {
//     owner: 'OWNER',
//     repo: 'REPO',
//     hook_id: 'HOOK_ID',
//     headers: {
//         'X-GitHub-Api-Version': '2022-11-28'
//     }
// })

// https://docs.neynar.com/reference/delete-webhook
// https://docs.github.com/en/rest/repos/webhooks?apiVersion=2022-11-28#delete-a-repository-webhook
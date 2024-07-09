import { error } from "console";

export async function deleteFarcasterWebhook() {
    try {
        const url = 'https://api.neynar.com/v2/farcaster/webhook/list';
        const options = {
            method: 'GET',
            headers: { accept: 'application/json', api_key: process.env.NEYNAR_API_KEY!! }
        };

        const webhooks = fetch(url, options)
            .then((res) => res.json())
            .then((json) => console.log(json))


        console.log(webhooks)
        // const url = 'https://api.neynar.com/v2/farcaster/webhook';
        // const options = {
        //     method: 'POST',
        //     headers: {
        //         accept: 'application/json',
        //         api_key: process.env.NEYNAR_API_KEY!!,
        //         'content-type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         subscription: { 'cast.created': { author_fids: [fid] } },
        //         name: `Ascend-Challenge-${challengeId}`,
        //         url: webhookUrl
        //     })
        // };

        // fetch(url, options)
        //     .then(res => res.json())
        //     .then(json => {
        //         console.log(json)
        //         res.status(200).json("Webhook created successfully")
        //     })
    }
    catch (e) {
        console.log("Error deleting farcaster webhook")
    }
}
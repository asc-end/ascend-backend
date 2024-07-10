
export async function deleteFarcasterWebhook(challengeId: string) {
    try {
        const url = 'https://api.neynar.com/v2/farcaster/webhook/list';
        const options = {
            method: 'GET',
            headers: { accept: 'application/json', api_key: process.env.NEYNAR_API_KEY!! }
        };

        const resp:any = await fetch(url, options).then((res) => res.json())

        if (!resp) throw Error()

        const webhook = resp.webhooks.find((w:any) => w.title == `Ascend-Challenge-${challengeId}`)[0]

        const deleteUrl = 'https://api.neynar.com/v2/farcaster/webhook';
        const deleteOptions = {
            method: 'DELETE',
            headers: {
                accept: 'application/json',
                api_key: process.env.NEYNAR_API_KEY!!,
                'content-type': 'application/json'
            },
            body: JSON.stringify({webhook_id: webhook.webhook_id})
        };

        fetch(url, options)
            .then(res => res.json())
            .then(json => console.log(json))
            .catch(err => console.error('error:' + err));
    }
    catch (e) {
        console.log("Error deleting farcaster webhook")
    }
}
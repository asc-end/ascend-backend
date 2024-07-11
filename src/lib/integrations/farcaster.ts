
export async function getFcWebhooks(fid: number) {
    const url = 'https://api.neynar.com/v2/farcaster/webhook/list';
    const options = {
        method: 'GET',
        headers: { accept: 'application/json', api_key: process.env.NEYNAR_API_KEY!! }
    };

    const resp: any = await fetch(url, options).then((res) => res.json())
    if (!resp) throw Error()

    const webhooks = resp.webhooks.filter((w: any) => w.title == `Ascend-Challenge-${fid}`)
    return webhooks
}

export async function deleteFcWebhook(fid: number) {
    try {
        const webhooks = await getFcWebhooks(fid)

        const deleteUrl = 'https://api.neynar.com/v2/farcaster/webhook';
        for (const webhook of webhooks) {
            console.log(webhook)
            const deleteOptions = {
                method: 'DELETE',
                headers: {
                    accept: 'application/json',
                    api_key: process.env.NEYNAR_API_KEY!!,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({ webhook_id: webhook.webhook_id })
            };
            const response = await fetch(deleteUrl, deleteOptions);
            const json = await response.json();
        }
    }
    catch (e) {
        console.log("Error deleting farcaster webhook")
    }
}

export async function createFcWebhook(fid: number) {
    try {

        const webhooks = await getFcWebhooks(fid)
        if (webhooks?.length) return "Webhook already exist."

        const webhookUrl = "https://ascend-backend-production.up.railway.app/integrations/farcaster/webhook/cast"

        const url = 'https://api.neynar.com/v2/farcaster/webhook';
        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                api_key: process.env.NEYNAR_API_KEY!!,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                subscription: { 'cast.created': { author_fids: [fid] } },
                name: `Ascend-Challenge-${fid}`,
                url: webhookUrl
            })
        };

        fetch(url, options)
            .then(res => res.json())
            .then(json => "Webhook created successfully.")
    }
    catch (e) {
        throw Error(e as any)
    }
}

export async function updateWebhook(id: string, fid: number, callbackUrl: string = 'https://ascend-backend-production.up.railway.app/integrations/farcaster/webhook/cast') {
    const url = 'https://api.neynar.com/v2/farcaster/webhook';
    const options = {
        method: 'PUT',
        headers: {
            accept: 'application/json',
            api_key: process.env.NEYNAR_API_KEY!!,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            subscription: { 'cast.created': { author_fids: [fid] } },
            webhook_id: id,
            url: callbackUrl,
            name: `Ascend-Challenge-${fid}`
        })
    };

    fetch(url, options)
        .then(res => res.json())
        .then(json => console.log(json))
        .catch(err => console.error('error:' + err));
}
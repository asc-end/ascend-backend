import { deleteFarcasterWebhook } from "./farcaster";

export async function deleteWebhook(challengeId: string) {
    // get challenge type and webhook id
    await deleteFarcasterWebhook(challengeId)
}
import { client } from "../../config";
import { deleteFcWebhook } from "./farcaster";
import { deleteGhWebhook } from "./github";

export async function getCurrentChallenges(user: string | number, target: string) {
    const query = `
        SELECT main_id FROM challenges_players
        WHERE (status = 'pending' OR status = 'during')
        AND user_name = $1
        AND target = $2
    `;

    return new Promise((resolve, reject) => {
        client.query(query, [user, target], (err, result) => {
            if (err) reject(err);
            else resolve(result.rows.length);
        });
    });
}

export async function deleteWebhook(user: string, target: string) {
    const challenges = await getCurrentChallenges(user, target)
    // there is still other challenges for this user so we don't delete webhook
    if (challenges) return

    if (target === "Farcaster") {
        await deleteFcWebhook(parseInt(user))
    }
    // will have other integrations in the future, would need refactor then
    else {
        await deleteGhWebhook(user, target)
    }
}
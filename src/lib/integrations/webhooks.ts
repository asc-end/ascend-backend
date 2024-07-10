import dayjs from "dayjs";
import { getDayWindow } from "../challenges";
import client from "../db";
import { deleteFarcasterWebhook } from "./farcaster";
import { validate } from "../solana/validate";

export async function deleteWebhook(challengeId: string) {
    // get challenge type and webhook id
    await deleteFarcasterWebhook(challengeId)
}

export async function validateDay(target: string, user: string, timestamp: number) {
    return new Promise((resolve, reject) => {
        try {
            const challengeQuery = `
            SELECT cp.*, u.address AS user_address, c.author AS author_address, c.solanaid, c.started
                FROM challenges_players cp
                JOIN users u ON cp.address = u.address
                JOIN challenges c ON cp.main_id = c.id
                WHERE cp.target = $1 AND cp.user_name = $2
            `;

            client.query(challengeQuery, [target, user], async (err, challengeResult) => {
                if (err) reject(`Internal server error : ${err.message}`);
                if (challengeResult.rows.length === 0) reject("No pending challenge found");

                const currentChallenge = challengeResult.rows[0];
                const { startOfWindow, endOfWindow } = getDayWindow(currentChallenge.started)
                const time = dayjs(timestamp)

                if (time.isAfter(startOfWindow) && time.isBefore(endOfWindow)) {
                    let resp = await validate(currentChallenge.solanaid, currentChallenge.author_address, currentChallenge.user_address)
                    if (!resp) throw Error()
                } else {
                    throw Error()
                }

                resolve("Successfully validated day.")
            });
        } catch (e) {
            console.log(e)
            reject(e)
        }
    })
}
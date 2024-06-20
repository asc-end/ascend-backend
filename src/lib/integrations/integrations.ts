import dayjs from "dayjs";

import { Octokit } from "octokit";
import neynarClient from "../neynar";
import client from "../db";
import { Challenge } from "../../types/types";
import { validate } from "../solana/validate";
import { getDayWindow } from "../challenges";
import { TweetV2UserTimelineParams, TwitterApi } from "twitter-api-v2";
import { twitterClient } from "./twitter";

const octokit = new Octokit()

export async function checkIfUserCastedToday(fid: number, startOfWindow: dayjs.Dayjs, endOfWindow: dayjs.Dayjs) {
    if (isNaN(fid)) {
        console.log('fid is NaN');
        return;
    }
    const resp = await neynarClient.fetchAllCastsCreatedByUser(fid, { limit: 1 })
    const date = dayjs(new Date(resp.result.casts[0].timestamp))
    console.log(date.isAfter(startOfWindow))
    console.log(date.isBefore(endOfWindow))
    console.log(date.toString())
    return (date.isAfter(startOfWindow) && date.isBefore(endOfWindow))
}

export async function checkIfUserCommitedToday(user: string, repo: string, startOfWindow: dayjs.Dayjs, endOfWindow: dayjs.Dayjs) {
    await octokit.request(`GET /repos/${user}/${repo}/commits`, {
        owner: user,
        repo: repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    }).catch(e => {
        console.error(e)
        throw (e)
    }).then((r) => {
        if (r.status !== 200) return false
        return r.data?.some((commit: any) => {
            const commitDate = commit.commit.committer.date?.slice(0, 10);
            return commitDate.isAfter(startOfWindow) && commitDate.isBefore(endOfWindow);
        });
    })
}

export async function checkIfUserTweetedToday(user: string, startOfWindow: dayjs.Dayjs, endOfWindow: dayjs.Dayjs) {
    try{
        console.log("CHECK IF USER TWEETED TODAY")
        let params: TweetV2UserTimelineParams = {
            // start_time: startOfWindow.toISOString(),
            // end_time: endOfWindow.toISOString(),
            exclude: ["replies", "retweets"],
            max_results: 1
        }
        const data = await twitterClient.v2.userTimeline("1090705607357808653", params)
        console.log(data)
    } catch(e){
        console.error(e)
    }
}

export async function checkExternalActions() {
    try {

        checkIfUserTweetedToday("", dayjs().subtract(2, "months"),dayjs())
        client.query(`
            SELECT
                challenges.*,
                challenges_players.status,
                challenges_players.address,
                challenges_players.nbDone
            FROM challenges
            INNER JOIN challenges_players ON challenges.id = challenges_players.main_id
            WHERE (challenges.type = 'Socials' OR challenges.type = 'Code')
                AND challenges_players.status = 'during'
        `, (err, res) => {
            if (err) {
                throw err;
            }
            res.rows.forEach(async (challenge: (Challenge & { nbdone: number, status: string, address: string })) => {
                const { daysSinceStart, startOfWindow, endOfWindow } = getDayWindow(challenge.started)

                console.log(daysSinceStart, startOfWindow.toString(), endOfWindow.toString())
                if (!challenge.challengedata?.user || challenge.nbdone > daysSinceStart) return

                let actionMade
                if (challenge.type == "Socials" && challenge.challengedata.socialMedia == "Farcaster")
                    actionMade = await checkIfUserCastedToday(challenge.challengedata.fid, startOfWindow, endOfWindow)
                else if (challenge.type == "Socials" && challenge.challengedata.socialMedia == "Twitter")
                    actionMade = await checkIfUserTweetedToday(challenge.challengedata.user, startOfWindow, endOfWindow)
                else if (challenge.type == "Code")
                    actionMade = await checkIfUserCommitedToday(challenge.challengedata.user, challenge.challengedata.repo.name, startOfWindow, endOfWindow)

                if (actionMade) {
                    let txSuccess = await validate(challenge.solanaid, challenge.author, challenge.address)
                    if (!txSuccess) {
                        throw Error("Tx not valid")
                    }
                }
            })
        });

    } catch (e) {
        console.log(e)
    }
}
import dayjs from "dayjs";

import { Octokit } from "octokit";
import { Challenge } from "../../schema/types";
import { validate } from "../solana/validate";
import { getDayWindow } from "../challenges";
import { TweetV2UserTimelineParams } from "twitter-api-v2";
import { twitterClient } from "../../config/twitter";
import axios from "axios";
import { load } from "cheerio"
import { client, neynarClient } from "../../config";

const octokit = new Octokit()

export async function checkIfUserCastedToday(fid: number, startOfWindow: dayjs.Dayjs, endOfWindow: dayjs.Dayjs) {
    console.log(fid, startOfWindow, endOfWindow)
    if (isNaN(fid)) {
        console.log('fid is NaN');
        return;
    }
    const resp = await neynarClient.fetchAllCastsCreatedByUser(fid, { limit: 1 })
    const date = dayjs(new Date(resp.result.casts[0].timestamp))
    console.log(date.isAfter(startOfWindow), startOfWindow.toString())
    console.log(date.isBefore(endOfWindow))
    console.log(date.toString())
    return (date.isAfter(startOfWindow) && date.isBefore(endOfWindow))
}


export async function scrapeGithub(url: string) {
    axios.get(url).then(response => {
        const html = response.data;

        // Load the HTML into Cheerio
        const $ = load(html);

        // Select the relative-time element
        const relativeTimeElement = $('relative-time');

        // Log the element to ensure it's found
        console.log('Found element:', $.html(relativeTimeElement));

        // Check if the element is found
        if (relativeTimeElement.length > 0) {
            // Fetch and log all attributes
            const attributes = relativeTimeElement.attr();
            console.log('Attributes:', attributes);

            // Fetch the datetime attribute specifically
            const datetime = relativeTimeElement.attr('datetime');
            console.log(`The datetime is: ${datetime}`);
        } else {
            console.log('relative-time element not found');
        }
    }).catch(error => {
        console.error('Error fetching the page:', error);
    });
}

export async function checkIfUserCommitedToday(user: string, repo: string, startOfWindow: dayjs.Dayjs, endOfWindow: dayjs.Dayjs) {
    if (dayjs().add(1, "hour").isAfter(endOfWindow)) {
        // scrapeGithub(`https://github.com/${user}/${repo}/commits`)
        // scrapeGithub(`https://github.com/asc-end/ascend/commits/feature/multiple-flashcard-decks`)
    }
    else {
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
}

export async function checkIfUserTweetedToday(user: string, startOfWindow: dayjs.Dayjs, endOfWindow: dayjs.Dayjs) {
    try {
        // console.log("CHECK IF USER TWEETED TODAY")
        let params: TweetV2UserTimelineParams = {
            // start_time: startOfWindow.toISOString(),
            // end_time: endOfWindow.toISOString(),
            exclude: ["replies", "retweets"],
            max_results: 1
        }
        const data = await twitterClient.v2.userTimeline("1090705607357808653", params)
        // console.log(data)
    } catch (e) {
        console.error(e)
    }
}

export async function checkExternalActions() {
    try {
        client.query(`
            SELECT
                challenges.*,
                challenges_players.status,
                challenges_players.address,
                challenges_players.nbDone,
                challenges_players.user_name,
                challenges_players.target
            FROM challenges
            INNER JOIN challenges_players ON challenges.id = challenges_players.main_id
            WHERE (challenges.type = 'Socials' OR challenges.type = 'Code')
                AND challenges_players.status = 'during'
        `, (err, res) => {
            if (err) {
                throw err;
            }
            res.rows.forEach(async (challenge: (Challenge & { nbdone: number, status: string, address: string })) => {
                // @ts-ignore
                const { daysSinceStart, startOfWindow, endOfWindow } = getDayWindow(challenge.begindate)

                console.log(daysSinceStart, startOfWindow.toString(), endOfWindow.toString(), challenge)
                if (!challenge.challengedata?.user || challenge.nbdone > daysSinceStart) return

                let actionMade
                if (challenge.type == "Socials" && challenge.challengedata.target == "Farcaster")
                    actionMade = await checkIfUserCastedToday(challenge.user_name, startOfWindow, endOfWindow)
                // else if (challenge.type == "Socials" && challenge.challengedata.socialMedia == "Twitter")
                //     actionMade = await checkIfUserTweetedToday(challenge.challengedata.user, startOfWindow, endOfWindow)
                // else if (challenge.type == "Code")
                // actionMade = await checkIfUserCommitedToday(challenge.challengedata.user, challenge.challengedata.repo.name, startOfWindow, endOfWindow)

                console.log(actionMade)
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

export async function validateDay(target: string, user: string, timestamp: string) {
    return new Promise((resolve, reject) => {
        try {
            console.log("Validate day for ", target, ", ", user)
            const challengeQuery = `
            SELECT cp.*, u.address AS user_address, c.author AS author_address, c.solanaid, c.started
                FROM challenges_players cp
                JOIN users u ON cp.address = u.address
                JOIN challenges c ON cp.main_id = c.id
                WHERE cp.target = $1 AND cp.user_name = $2
            `;

            client.query(challengeQuery, [target, user], async (err, challengeResult) => {
                if (err) reject(`Internal server error : ${err.message}`);
                console.log("Challenge query")
                if (challengeResult.rows.length === 0 || !challengeResult) reject("No pending challenge found");

                for (const challenge of challengeResult.rows) {

                    const { startOfWindow, endOfWindow } = getDayWindow(challenge.started)
                    const time = dayjs(timestamp)
                    const now = dayjs()

                    console.log(timestamp, startOfWindow.toString(), endOfWindow.toString(), time.toString(), time.isAfter(startOfWindow), time.isBefore(endOfWindow))


                    if (time.isAfter(startOfWindow) && time.isBefore(endOfWindow) && now.isAfter(startOfWindow) && now.isBefore(endOfWindow)) {
                        console.log("is in window")
                        let resp = await validate(challenge.solanaid, challenge.author_address, challenge.user_address)
                        if (!resp) throw Error()
                        resolve("Successfully validated day.")
                    }
                };
                reject("no challenge in window")

            });
        } catch (e) {
            console.log(e)
            reject(e)
        }
    })
}
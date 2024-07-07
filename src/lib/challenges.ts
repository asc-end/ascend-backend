import dayjs, { Dayjs } from "dayjs";
import { QueryResult } from "pg";
import client from "./db";
import { PublicKey } from "@solana/web3.js";
import { ChainChallenge, Challenge, ChallengePlayer } from "../types/types";

export function getDayWindow(startedAt: string) {
    const challengeStartDate = dayjs(startedAt);
    const daysSinceStart = dayjs().diff(challengeStartDate, 'day');
    const startOfWindow = challengeStartDate.add(daysSinceStart, 'day');
    const endOfWindow = challengeStartDate.add(daysSinceStart + 1, 'day');

    return { daysSinceStart, startOfWindow, endOfWindow }
}

export async function archiveChallenge(challengeId: string, address: string) {
    const query = `
        UPDATE challenges_players 
        SET status = CASE 
            WHEN status = 'won' THEN 'archived-won'
            WHEN status = 'lost' THEN 'archived-lost'
            ELSE status
        END
        WHERE main_id = $1 AND address = $2
    `;
    return new Promise((resolve, reject) => {
        client.query(query, [challengeId, address], (err, result) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                console.log(result)
                resolve(result);
            }
        });
    });
}

export async function setChallengeDone(solanaId: number, address: string, status: "won" | "lost") {
    const query = `
        UPDATE challenges_players 
        SET status = $3
        WHERE solana_id = $1 AND address = $2
    `;
    return new Promise((resolve, reject) => {
        client.query(query, [solanaId, address, status], (err, result) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                console.log(result)
                resolve(result);
            }
        });
    });
}

export async function setDayDone() {

    const query =
        `UPDATE challenges_players
    SET 
        nbDone = nbDone + 1,
        status = CASE 
            WHEN (SELECT time FROM challenges WHERE id = challenges_players.main_id) = nbDone + 1 THEN 'won' 
            ELSE status
        END
    WHERE main_id = $1 AND address = $2`;
}


export async function setLostChallengesAsFinished() {
    const query = `
        UPDATE challenges_players 
        SET status = 'lost' 
        FROM challenges 
        WHERE challenges_players.main_id = challenges.id 
        AND challenges_players.status = 'during' 
        AND challenges.begindate + (challenges_players.nbDone || ' day')::interval < CURRENT_DATE;
    `;
    return new Promise((resolve, reject) => {
        client.query(query, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

export async function setWonChallengesAsFinished() {
    const query = `
        UPDATE challenges_players 
        SET status = 'won' 
        FROM challenges 
        WHERE challenges_players.main_id = challenges.id 
        AND challenges_players.status = 'during' 
        AND challenges.time = challenges_players.nbdone;
    `;
    return new Promise((resolve, reject) => {
        client.query(query, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

export async function updateNbDone(id: number, address: string, nbdone: number) {
    const query = `UPDATE challenges_players
        SET
            nbdone = $3
        WHERE main_id = $1 AND address = $2`;

    return new Promise((resolve, reject) => {
        client.query(query, [id, address, nbdone], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

export function getAllChallenges(): Promise<QueryResult<Challenge>> {

    const query = `SELECT * from challenges`;
    return new Promise((resolve, reject) => {
        client.query(query, (err, result) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

export function getPlayers(challengeId: number): Promise<QueryResult<ChallengePlayer>> {
    const query = `SELECT * from challenges_players WHERE main_id = $1`

    return new Promise((resolve, reject) => {
        client.query(query, [challengeId], (err, result) => {
            if (err) {
                console.log(err)
                reject(err);
            }
            else
                resolve(result)
        })
    })

}

export function addChallengePlayers(players: string[], challengeId: number, challengedata: { user: number, target: string }) {
    const playerChallengeQuery = "INSERT INTO challenges_players (main_id, status, address, nbDone, user_name, target) VALUES ($1, $2, $3, $4, $5, $6)";

    return new Promise((resolve, reject) => {
        const promises = players.map((player: string, i: number) => {
            const playerData = [challengeId, i === 0 ? "during" : "pending", player, 0, i === 0 && challengedata.user, i === 0 && challengedata.target];

            return new Promise((resolve, reject) => {
                client.query(playerChallengeQuery, playerData, (err, result) => {
                    if (err) {
                        console.log(err.stack);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        });

        Promise.all(promises)
            .then(results => resolve(results))
            .catch(err => reject(err));
    });
}
export async function createChallenge(begindate: dayjs.Dayjs, type: string, stake: number, time: number, players: string[], challengedata: object, solanaid: number): Promise<number | null>{    
    const jsondata = JSON.stringify(challengedata)
    const challengeQuery = "INSERT INTO challenges (begindate, type, stake, time, author, challengedata, solanaid) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id"
    return new Promise((resolve, reject) =>
        client.query(challengeQuery, [begindate.toISOString(), type, stake, time, players[0], jsondata, solanaid], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                const challengeId = result.rows[0].id;
                await addChallengePlayers(players, challengeId, challengedata as { user: number, target: string }).catch(e => reject(err))
                resolve(challengeId)

            }
        }))
}
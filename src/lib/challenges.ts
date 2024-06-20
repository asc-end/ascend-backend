import dayjs from "dayjs";
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

export async function setChallengeDone(challengeId: string, address: string) {
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
        AND challenges.begindate + (challenges_players.nbDone * INTERVAL '1 day') < CURRENT_DATE;
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
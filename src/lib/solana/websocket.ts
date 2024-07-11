import { executeQueryWithParams } from "../..";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { client, borshAccount, connection, program } from "../../config";
import { QueryResult } from "pg";
import { getAllChallenges } from "../challenges";
import dayjs from "dayjs";


function getState(state: any){
    let _state: string

    if (state.canceled)
       _state = "Canceled"
    else if (state.finished)
        _state = "Finished"
    else if (state.ongoing)
        _state = "Ongoing"
    else
        _state = "Pending"
    return _state
}

export async function createWebsocket() {
    const id = connection.onProgramAccountChange(program.programId, async (updatedProgramInfo, context) => {
        try {
            const account = borshAccount.decode(updatedProgramInfo.accountInfo.data)

            const updateChallengesQuery = `
            UPDATE challenges
                SET stake = $1, time = $2, created = to_timestamp($3), started = to_timestamp($4), state = $5
                WHERE solanaid = $6
                RETURNING id
            `;

            const state = getState(account.state)
            console.log("UPDATE STATE", account, state)
            const challengesParams = [
                account.stake.toNumber() / LAMPORTS_PER_SOL,
                account.time,
                account.created.toNumber(),
                account.started.toNumber(),
                state,
                account.id.toNumber()
            ];

            let res: QueryResult = await new Promise((resolve, reject) => {
                client.query(updateChallengesQuery, challengesParams, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            const mainId = res.rows[0].id;
            if (!mainId) return
            account.players.map((p: PublicKey, i: number) => {
                let status
                if (account.counter[i] == account.time)
                    status = account.deposit[i] ? "won" : "archived-won"
                else if (dayjs.unix(account.started).add(account.counter[i] + 1, "days").isBefore(dayjs()))
                    status = "lost"
                else if ((state == "Pending" || state == "Ongoing") && account.deposit[i])
                    status = "during"
                else if (state == "Pending" && !account.deposit[i])
                    status = "pending"

                const updateChallengesPlayersQuery = `
                UPDATE challenges_players
                SET nbdone = $1, 
                    status = CASE 
                            WHEN status = 'archived-lost' THEN status
                            ELSE $2
                            END
                FROM challenges
                WHERE main_id = $3 AND address = $4
                `;
                const challengesPlayersParams = [
                    account.counter[i],
                    status,
                    mainId,
                    p.toBase58(),
                ];
                executeQueryWithParams(updateChallengesPlayersQuery, challengesPlayersParams);
            })
        }
        catch (e) {
            console.log(e)
        }
    })
    console.log("PROGRAM ACCOUNT CHANGE ID ", id)
}

export async function syncDbWithChain() {
    const accounts = await program?.account.vault.all();
    const dbAccounts = await getAllChallenges()

    try {

        for (const { account, publicKey } of accounts) {

            console.log(account)
            const updateChallengesQuery = `
            UPDATE challenges
                SET stake = $1, time = $2, created = to_timestamp($3), started = to_timestamp($4), state = $5
                WHERE solanaid = $6
                RETURNING id
            `;

            const state = getState(account.state)
            const challengesParams = [
                account.stake.toNumber() / LAMPORTS_PER_SOL,
                account.time,
                account.created.toNumber(),
                account.started.toNumber(),
                state,
                account.id.toNumber()
            ];
            let mainId

            let res: QueryResult = await new Promise((resolve, reject) => {
                client.query(updateChallengesQuery, challengesParams, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });

            mainId = res.rows[0].id;

            console.log("main id", typeof mainId)
            console.log()
            if (!mainId) return
            account.players.map((p: PublicKey, i: number) => {
                console.log(account.counter[i], p.toBase58())
                let status
                console.log(mainId, state, account.counter[i], dayjs.unix(account.started).toString(), dayjs.unix(account.started).add(account.counter[i] + 1, "days").isBefore(dayjs()), account.deposit[i])
                if (account.counter[i] == account.time)
                    status = account.deposit[i] ? "won" : "archived-won"
                else if (dayjs.unix(account.started).add(account.counter[i] + 1, "days").isBefore(dayjs()))
                    status = "lost"
                else if ((state == "Pending" || state == "Ongoing") && account.deposit[i])
                    status = "during"
                else if (state == "Pending" && !account.deposit[i])
                    status = "pending"

                const updateChallengesPlayersQuery = `
                UPDATE challenges_players
                SET nbdone = $1, 
                    status = CASE 
                            WHEN status = 'archived-lost' THEN status
                            ELSE $2
                            END
                FROM challenges
                WHERE main_id = $3 AND address = $4
                `;
                const challengesPlayersParams = [
                    account.counter[i],
                    status,
                    mainId,
                    p.toBase58(),
                ];
                executeQueryWithParams(updateChallengesPlayersQuery, challengesPlayersParams);
            })
        }
    }
    catch (e) {
        console.log(e)
    }
}
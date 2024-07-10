import { createChallenge, getAllChallenges, setLostChallengesAsFinished } from "../lib/challenges";
import { close } from "../lib/solana/close";
import { checkExternalActions } from "../lib/integrations/integrations";
import { program } from "../config/solana";
import dayjs from "dayjs";

export async function indexOnChainData() {
    checkExternalActions()
    const accounts = await program?.account.vault.all();
    const dbAccounts = await getAllChallenges()

    const acc = accounts.find(e => e.publicKey.toString() == "5LDBXMZLNziwZYggUJoGypX9bArkT9ZJETJiH27waNiT")

    console.log(acc?.account.id.toNumber(), acc?.account.started.toNumber(), dayjs.unix(1720015149).toString())
    console.log(accounts.map(a => a.publicKey.toString()))
    for (const { account, publicKey } of accounts) {
        if (account.state.finished) {
            close(account.players[0], publicKey)
            return
        }
        const challenge = dbAccounts.rows.find(dbAccount => (dbAccount.solanaid.toString() === account.id.toString() && dbAccount.author.toString() == account.players[0].toString()));
        if (account.players[0].toString() == "2ppGspBAtbbg6B5cPwUfF1TuCuZJyJGQ9PaxYqmmCvH5")
            console.log(challenge, account)
        const challengeId = challenge ? challenge.id : await createChallenge(dayjs.unix(account.created.toNumber()), "UNKOWN", account.stake.toNumber(), account.time, account.players.map(p => p.toString()), {}, account.id.toNumber())

        if (challengeId) {
            // const challengesPlayers = await getPlayers(challengeId)
            // account.counter.forEach((playerCounter, index) => {
            //     const dbPlayer = challengesPlayers.rows[index]
            //     if (!dbPlayer) { }
            //     else if (playerCounter !== dbPlayer.nbdone && dbPlayer.status == "during") {
            //         updateNbDone(dbPlayer.main_id, dbPlayer.address, playerCounter)
            //     }
            // })
        }
    }
    await setLostChallengesAsFinished()
    // await setWonChallengesAsFinished()
}
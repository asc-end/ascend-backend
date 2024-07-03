import { createChallenge, getAllChallenges, getPlayers, setChallengeDone, setLostChallengesAsFinished, setWonChallengesAsFinished, updateNbDone } from "../lib/challenges";
import { close } from "../lib/solana/close";
import { checkExternalActions } from "../lib/integrations/integrations";
import { program } from "../lib/solana/config";

export async function indexOnChainData() {
    checkExternalActions()
    const accounts = await program?.account.vault.all();
    const dbAccounts = await getAllChallenges()

    for (const { account, publicKey } of accounts) {
        if (account.state.finished) {
            close(account.players[0], publicKey)
            return
        }
        const challenge = dbAccounts.rows.find(dbAccount => (dbAccount.solanaid.toString() === account.id.toString() && dbAccount.author.toString() == account.players[0].toString()));
        const challengeId = challenge ? challenge.id : await createChallenge(account.created.toNumber(), "UNKOWN", account.stake.toNumber(), account.time, account.players.map(p => p.toString()), {}, account.id.toNumber())

        if (challengeId) {
            const challengesPlayers = await getPlayers(challengeId)
            account.counter.forEach((playerCounter, index) => {
                const dbPlayer = challengesPlayers.rows[index]
                if (!dbPlayer) { }
                else if (playerCounter !== dbPlayer.nbdone && dbPlayer.status == "during") {
                    updateNbDone(dbPlayer.main_id, dbPlayer.address, playerCounter)
                }
            })
        }
    }
    await setLostChallengesAsFinished()
    await setWonChallengesAsFinished()
}
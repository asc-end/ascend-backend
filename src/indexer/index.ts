import { getAllChallenges, getPlayers, setLostChallengesAsFinished, updateNbDone } from "../lib/challenges";
import { close } from "../lib/solana/close";
import { checkExternalActions } from "../lib/integrations/integrations";
import { program } from "../lib/solana/config";

export async function indexOnChainData() {
    checkExternalActions()
    const accounts = await program.account.vault.all();
    const dbAccounts = await getAllChallenges()

    setLostChallengesAsFinished()
    accounts.forEach(async (e) => {
        if (e.account.state.finished) {
            close(e.account.players[0], e.publicKey)
            return
        }
        const challenge = dbAccounts.rows.find(account => (account.solanaid.toString() === e.account.id.toString() && account.author.toString() == e.account.players[0].toString()));
        if (!challenge) {
            //shouldnt occur
            console.log('no challenge', e.account.id.toString())
            return
        }

        const challengesPlayers = await getPlayers(challenge.id)
        e.account.counter.forEach((chainPlayer, index) => {
            const dbPlayer = challengesPlayers.rows[index]
            if (chainPlayer !== dbPlayer.nbdone) {
                updateNbDone(dbPlayer.main_id, dbPlayer.address, chainPlayer)
            }
        })
    })
}
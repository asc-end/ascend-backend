
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getProgramDerivedAddress } from "./utils";
import { borshAccount, connection, keypair, program } from "../../config/solana";

export async function close(author: PublicKey, account: PublicKey) {
    program.methods
        .close(author)
        .accounts({
            withdrawKey: keypair.publicKey,
            vault: account,
            systemProgram: SystemProgram.programId
        })
        .signers([keypair])
        .rpc()
}

export async function closePda(id: number, authorAddress: string) {
    try {
        let author = new PublicKey(authorAddress)

        const idBn = new anchor.BN(id);
        const vault_pda = getProgramDerivedAddress("vault", author, idBn, program.programId);
        const tx = await program.methods
            .close(author)
            .accounts({ withdrawKey: keypair.publicKey, vault: vault_pda, systemProgram: SystemProgram.programId })
            .signers([keypair])
            .rpc()
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

export async function getAllClosable() {
    const accounts = await connection.getProgramAccounts(program.programId)

    let accountsToClose = accounts.map((account, i) => {
        const decoded = borshAccount.decode(account.account.data)
        let state = decoded.state
        if (decoded.state == 2)
            return { id: decoded.id, author: decoded.players[0] }
        return null
    }).filter(e => e !== null)

    accountsToClose.forEach((account) => closePda(account?.id, account?.author))
}

export async function closeAllClosableAccounts() {
    const vaults = program.account.vault.all()
}
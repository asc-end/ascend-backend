
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { connection, keypair, program } from "./test";
import { getProgramDerivedAddress } from "./utils";
import * as borsh from '@project-serum/borsh'

export async function close(id: number, authorAddress: string) {
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
    } catch (e){
        console.error(e)
        return false
    }
}

const borshAccount = borsh.struct([
    borsh.u64("discriminator"),
    borsh.vec(borsh.publicKey(), "players"),
    borsh.publicKey('validateKey'),
    borsh.publicKey('withdrawKey'),
    borsh.u64("id"),
    borsh.u64("stake"),
    borsh.u8("time"),
    borsh.vec(borsh.bool(), "deposit"),
    borsh.u64("balance"),
    borsh.vecU8("counter"),
    borsh.i64("created"),
    borsh.i64("started"),
    borsh.i64("state"),

  ])


export async function getAllClosable(){
    const accounts = await connection.getProgramAccounts(program.programId)

    let accountsToClose = accounts.map((account, i) => {
        const decoded = borshAccount.decode(account.account.data)
        let state = decoded.state 
        console.log(decoded.counter)
        if(decoded.state == 2)
            return {id: decoded.id, author: decoded.players[0]}
        return null
    }).filter(e => e !== null)

    accountsToClose.forEach((account) => close(account?.id, account?.author))
}
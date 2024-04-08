
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { connection, keypair, program } from "./test";
import { getProgramDerivedAddress } from "./utils";


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


export async function getAllClosable(){
    const accounts = await connection.getProgramAccounts(program.programId,
        {
            // filters: [
            //     {
            //         memcmp: {

            //         }
            //     }
            // ]
        })

    accounts.forEach((account, i) => {
        console.log(account.account.data, account.pubkey)
    })
}
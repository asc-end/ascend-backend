
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getProgramDerivedAddress } from "./utils";
import { keypair, program } from "../../config/solana";

export async function validate(id: number, authorAddress: string, playerAddress: string) {
    try {
        let author = new PublicKey(authorAddress)
        let player = new PublicKey(playerAddress)

        const idBn = new anchor.BN(id);
        const vault_pda = getProgramDerivedAddress("vault", author, idBn, program.programId);

        const tx = await program.methods
            .validate(player)
            .accounts({ validateKey: keypair.publicKey, vault: vault_pda })
            .signers([keypair])
            .rpc()
        return tx
    } catch (e) {
        console.error(e)
        return false
    }
}
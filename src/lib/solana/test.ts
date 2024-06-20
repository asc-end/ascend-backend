
import {
    Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { getProgramDerivedAddress } from "./utils";
import { connection, keypair, program } from "./config";

const closeKey = new Keypair()
const user1 = new Keypair()

const players = [user1.publicKey, ...Array.from({ length: 4 }, () => Keypair.generate().publicKey)];

export async function create() {
    let player = keypair

    const id = new anchor.BN(2);
    const stake = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const time = 10;
    const vault_pda = getProgramDerivedAddress("vault", player.publicKey, id, program.programId);

    const balanceBefore = await connection.getBalance(keypair.publicKey)
    const balanceUserBefore = await connection.getBalance(user1.publicKey)

    if (balanceUserBefore == 0) {
        try {
            await connection.requestAirdrop(user1.publicKey, 10 * LAMPORTS_PER_SOL)

        } catch (e) {
            console.log(e)
        }
        const balanceUserAfter = await connection.getBalance(user1.publicKey)
    }

    const ix = await program.methods
        .create(id, stake, time, [player.publicKey], keypair.publicKey, closeKey.publicKey)
        .accounts({ player: player.publicKey, vault: vault_pda, systemProgram: SystemProgram.programId })
        .signers([player])
        // .instruction()
        .rpc()


    const vault_data = await program.account.vault.fetch(vault_pda);
}


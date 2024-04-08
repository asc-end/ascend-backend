
import {
    Connection,
    TransactionMessage,
    VersionedTransaction,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    clusterApiUrl,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import * as bip39 from "bip39";
import { Vault } from "./vault";
import * as idl from './solana'
// const IDL: Vault = require('./vault.json');
import IDL from './vault.json';
import { Program, utils } from '@coral-xyz/anchor';
import * as anchor from "@coral-xyz/anchor";

import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { getProgramDerivedAddress } from "./utils";


export const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

// const programID = new PublicKey("GdsmCboGiCzyUPyPBZE5EkiVtmmnYwjwXRuvre1Czv1n")
// const programID = new PublicKey("7VQVgAcErphgCQAiMSzwej8M8r9kZyq8DKyvcsSDHSbC")
const programID = new PublicKey("61YKY1VZHnorxWB5dtmKbWHDwMvnoDJnh9PkoBmeLKDK")


const seed = bip39.mnemonicToSeedSync(process.env.MNEMONIC!, ""); // (mnemonic, password)
export const keypair = Keypair.fromSeed(seed.slice(0, 32))

const closeKey = new Keypair()
const user1 = new Keypair()

// anchor.setProvider(anchor.AnchorProvider.env());
const wallet = new NodeWallet(keypair);
const provider = new AnchorProvider(connection, wallet, {})
export const program = new Program<Vault>(IDL as unknown as Vault, programID, provider);


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
        console.log(balanceUserAfter)


    }

    console.log(keypair.publicKey.toString())


    console.log(balanceBefore, balanceUserBefore)
    // await provider.connection.requestAirdrop(user1.publicKey, 10)
    // .rpc().catch(e => console.error(e))
    const ix = await program.methods
    .create(id, stake, time, [player.publicKey], keypair.publicKey, closeKey.publicKey)
    .accounts({ player: player.publicKey, vault: vault_pda, systemProgram: SystemProgram.programId })
    .signers([player])
    // .instruction()
    .rpc()
    
    // const blockhash = await connection.getLatestBlockhash()

    // const tx = new Transaction().add(ix)
    // tx.recentBlockhash = blockhash.blockhash
    // tx.feePayer = player.publicKey

    // wallet.signTransaction(tx)
    // const blockHeight = await connection.getBlockHeight()
    
    const vault_data = await program.account.vault.fetch(vault_pda);
    console.log(vault_data)
}

// create()
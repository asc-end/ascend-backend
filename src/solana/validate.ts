
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
const IDL: Vault = require('./vault.json');
import { Program, utils } from '@coral-xyz/anchor';
import * as anchor from "@coral-xyz/anchor";
import { connection, keypair, program } from "./test";
import { getProgramDerivedAddress } from "./utils";


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
        return true
    } catch (e){
        console.error(e)
        return false
    }
}
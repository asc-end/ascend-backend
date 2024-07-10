import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { IDL, Vault } from "../lib/solana/idl/vault";
import * as bip39 from "bip39";
import * as borsh from '@project-serum/borsh'

export const connection = new Connection(process.env.RPC_URL!!, {commitment: "confirmed", wsEndpoint: process.env.WS_URL!!} )
const programID = new PublicKey("61YKY1VZHnorxWB5dtmKbWHDwMvnoDJnh9PkoBmeLKDK")

const seed = bip39.mnemonicToSeedSync(process.env.MNEMONIC!, ""); // (mnemonic, password)
export const keypair = Keypair.fromSeed(seed.slice(0, 32))

const wallet = new NodeWallet(keypair);
const provider = new AnchorProvider(connection, wallet, {})

export const program = new Program<Vault>(IDL as unknown as Vault, programID, provider)


export const borshAccount = borsh.struct([
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
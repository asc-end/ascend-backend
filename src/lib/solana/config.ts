import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { IDL, Vault } from "./idl/vault";
import * as bip39 from "bip39";

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed")
const programID = new PublicKey("61YKY1VZHnorxWB5dtmKbWHDwMvnoDJnh9PkoBmeLKDK")

const seed = bip39.mnemonicToSeedSync(process.env.MNEMONIC!, ""); // (mnemonic, password)
export const keypair = Keypair.fromSeed(seed.slice(0, 32))

const wallet = new NodeWallet(keypair);
const provider = new AnchorProvider(connection, wallet, {})

export const program = new Program<Vault>(IDL as unknown as Vault, programID, provider)

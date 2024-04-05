import { Connection, clusterApiUrl, Keypair} from "@solana/web3.js"
import * as bip39 from "bip39";

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

const seed = bip39.mnemonicToSeedSync(process.env.MNEMONIC!, ""); // (mnemonic, password)
export  const keypair = Keypair.fromSeed(seed.slice(0, 32))


// const transferTransaction = new web3.Transaction().add(
//     web3.SystemProgram.transfer({
//       fromPubkey: keypair.publicKey,
//       toPubkey: toKeypair.publicKey,
//       lamports: 1 * web3.LAMPORTS_PER_SOL,
//     })
//   );
  
// web3.sendAndConfirmTransaction(connection, transferTransaction, [keypair]).then(() => {}).catch(e => console.log(e))
  
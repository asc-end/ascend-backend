import { PublicKey } from "@solana/web3.js";
import {utils, BN} from "@coral-xyz/anchor";

export const getProgramDerivedAddress = (bytes: string, pk: PublicKey, id: BN, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync([
        utils.bytes.utf8.encode(bytes),
        pk.toBuffer(),
        id.toBuffer("le", 8)
    ], programId)[0];
}
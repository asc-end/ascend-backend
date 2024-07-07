export interface Challenge {
    id: number,
    stake: number,
    time: number,
    deposit: boolean[]
    balance: bigint,
    created: string,
    started: string,
    solanaid: number,
    type: string,
    author: string,
    challengedata: any
    state?: "Pending" | "Ongoing" | "Finished" | "Canceled" | "Closed",
    user_name: number,
    target: string,
}

export interface ChainChallenge {
    validateKey: PublicKey,
    players: PublicKey[],
    withdrawKey: PublicKey,
    id: number,
    stake: number,
    time: number,
    balance: number,
    deposit: boolean[],
    counter: boolean[],
    created: number,
    started: number,
    state: number
}

export interface ChallengePlayer {
    id: number,
    main_id: number,
    status: "pending" | "lost" | "won" | "archived-won" | "archived-lost" | "during",
    address: string,
    nbdone: number
}
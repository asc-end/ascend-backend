import { createAppClient, viemConnector } from "@farcaster/auth-client";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { config } from "dotenv";

config();

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("Make sure you set NEYNAR_API_KEY in your .env file");
}

const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

export const appClient = createAppClient({
  relay: 'https://relay.farcaster.xyz',
  ethereum: viemConnector(),
});

export { neynarClient };
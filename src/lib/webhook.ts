import { Helius, Address } from "helius-sdk";

export async function addAddress(address: string) {
    const helius = new Helius(process.env.HELIUS_API_KEY!!);
    await helius.appendAddressesToWebhook(process.env.HELIUS_WEBHOOK_ID!!, [address]);
}
import { TwitterApi } from "twitter-api-v2";

const _twitterClient = new TwitterApi({appKey: process.env.TWITTER_CONSUMER_ID!!, appSecret: process.env.TWITTER_CONSUMER_SECRET!!, accessSecret: process.env.TWITTER_ACCESS_SECRET, accessToken: process.env.TWITTER_ACCESS_TOKEN});
export const twitterClient = _twitterClient;
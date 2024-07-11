import { executeQuery } from "..";

export const tables = [
    `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        address TEXT UNIQUE,
        pfp_url TEXT,
        cover_picture_url TEXT,
        description TEXT
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS levels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total INTEGER,
        language INTEGER,
        socials INTEGER,
        meditation INTEGER,
        code INTEGER,
        sport INTEGER
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user1 TEXT,
        user2 TEXT,
        status TEXT
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        created TIMESTAMP,
        started TIMESTAMP,
        solanaid INTEGER,
        time INTEGER,
        type TEXT,
        stake NUMERIC,
        author TEXT,
        state TEXT,
        challengedata JSONB
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS challenges_players (
        id SERIAL PRIMARY KEY,
        main_id INTEGER REFERENCES challenges(id),
        status TEXT,
        address TEXT,
        nbDone INTEGER,
        user_name TEXT,
        target TEXT
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS decks (
        id SERIAL PRIMARY KEY,
        name TEXT,
        tags JSONB,
        columns JSONB
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        deck_id SERIAL REFERENCES decks(id) ON DELETE SET NULL 
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS users_cards (
        id SERIAL PRIMARY KEY,
        card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
        user_id SERIAL REFERENCES users(id) ON DELETE SET NULL,
        level INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS app_profiles (
        id SERIAL PRIMARY KEY,
        app_id SERIAL,
        address TEXT REFERENCES users(address) ON DELETE SET NULL,
        username TEXT,
        app TEXT   
    );
    `
    // `ALTER TABLE users_cards ADD CONSTRAINT uc_user_card UNIQUE (user_id, card_id);`
];


export function createTables() {
    tables.forEach((table) => executeQuery(table))
}

import {client} from "../config";

async function insertDeck(deck_name: string, tags: string[], columns: string[]): Promise<number> {
    const query = `
        INSERT INTO decks 
        ( name, tags, columns ) SELECT $1, $2, $3
        RETURNING id;
    `;
    return new Promise((resolve, reject) => {
        client.query(query, [deck_name, JSON.stringify(tags), JSON.stringify(columns)], (err, result) => {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                resolve(result.rows[0].id);
            }
        });
    });
}

async function createCardTable(deck_id: number, columns: string) {
    const query = `CREATE TABLE IF NOT EXISTS deck_${deck_id}_cards (id SERIAL PRIMARY KEY, card_id SERIAL REFERENCES cards(id) ON DELETE SET NULL, ${columns})`;
    return new Promise((resolve, reject) => {
        client.query(query, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

async function insertCard(deck_id: number, columns: string, card: any) {
    // Insert into cards table and get the id of the inserted card
    const cardQuery = `
        INSERT INTO cards 
        (deck_id) VALUES ($1)
        RETURNING id;
    `;
    const cardId = await new Promise((resolve, reject) => {
        client.query(cardQuery, [deck_id], (err, result) => {
            if (err) reject(err);
            else resolve(result.rows[0].id);
        });
    });
    const placeholders = Object.keys(card).map((_, i) => `$${i + 2}`).join(', ');

    const languageCardQuery = `
        INSERT INTO deck_${deck_id}_cards 
        (card_id, ${columns}) VALUES ($1, ${placeholders})
    `;
    return new Promise((resolve, reject) => {
        client.query(languageCardQuery, [cardId, ...card]
            , (err, result) => err ? reject(err) : resolve(result))
    })
}

export async function createDeck(deck_name: string, tags: string[], data: any[]) {
    try {
        const columnsArray = Object.keys(data[0]).map(key => `${key}`)
        const deckId = await insertDeck(deck_name, tags, columnsArray)
        
        const columnsString = columnsArray.join(', ');
        const columnsTypes = Object.keys(data[0]).map(key => `${key} TEXT`).join(', ');
        const values = data.map(obj => Object.values(obj));

        await createCardTable(deckId, columnsTypes)
        console.log("cards table created")
        for (const card of values) {
            await insertCard(deckId, columnsString, card);
            console.log("card create:", card)
        }
        console.log("all cards added")

    } catch (e) {
        console.log(e)
    }
}
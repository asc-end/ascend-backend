import client from "../../lib/db";
import express from "express";
import { createDeck } from "../../lib/flaschards";
import { data as language } from "../../../flashcards"
import { data as countries } from "../../../countries"

const router = express.Router();

router.post("/deck", async (req, res) => {
    try {
        const { name, category } = req.body
        let data
        if (name == "Language") {
            data = language
        }
        else if (name == "Capitals") {
            data = countries
        }
        else
            return
        await createDeck(name, [category], data)
        res.status(200).json({ message: "Deck added successfully" })
    }
    catch (err) {
        console.error("Error fetching actual data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.get("/decks", async (req, res) => {
    try {
        client.query(`SELECT * FROM decks LIMIT 30`, (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        })
    }
    catch (err) {
        console.error("Error fetching actual data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.get("/deck", async (req, res) => {

})

router.get("/deck/:id/cards", async (req, res) => {
    try {
        const { id } = req.params;
        const { challenge, from, to, userId } = req.query

        const query = `
            SELECT ${from}, ${to}, deck_${id}_cards.card_id, deck_${id}_cards.id, coalesce(users_cards.level, 0) as level, coalesce(users_cards.last_updated, NOW()) as last_updated
            FROM deck_${id}_cards 
            LEFT JOIN users_cards ON deck_${id}_cards.card_id = users_cards.card_id AND users_cards.user_id = $1
            WHERE (users_cards.level IS NULL OR users_cards.last_updated <= NOW() - INTERVAL '1 day' * CASE users_cards.level
                WHEN 0 THEN 1
                WHEN 1 THEN 2
                WHEN 2 THEN 5
                WHEN 3 THEN 10
                WHEN 4 THEN 20
                WHEN 5 THEN 30
                WHEN 6 THEN 90
                ELSE 365
            END)
            ORDER BY level ASC, RANDOM()
            LIMIT 30
        `;

        client.query(query, [userId], (err, result) => {
            if (err) {
                console.error("Error fetching cards:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        })
    }
    catch (err) {
        console.error("Error fetching cards:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})

router.post("/validate", async (req, res) => {
    try {
        const { userId, cardIds } = req.body;
        const query = `
            INSERT INTO users_cards (user_id, card_id, last_updated)
            VALUES ($1, unnest($2::int[]), NOW())
            ON CONFLICT (user_id, card_id)
            DO UPDATE SET level = users_cards.level + 1, last_updated = NOW()
            WHERE users_cards.level < 7
        `;
        await client.query(query, [userId, cardIds]);
        res.status(200).json({ message: "Cards updated successfully" });
    } catch (err) {
        console.error("Error updating cards:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router



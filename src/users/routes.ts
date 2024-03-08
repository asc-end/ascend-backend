import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req, res) => {
    client.query(`SELECT * FROM users`, (err, result) => {
        if (err) {
            console.error("Error fetching actual data:", err);
            res.status(500).json({ error: "Internal server error" });
        } else {
            res.json(result.rows);
        }
    });
})


router.post("/", (req, res) => {
    try {
        const { userId, description } = req.body;

        // Update the user's description in the database
        const query = 'UPDATE users SET description = $1 WHERE id = $2';
        const result = client.query(query, [description, userId]);

        res.json({ message: 'User description updated successfully' });
    } catch (err) {
        console.error('Error updating user description:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.post('/new-user', async (req, res) => {
    try {
        const { username, address, description } = req.body;

        client.query(`
        INSERT INTO users (name, address, pfp_url, cover_picture_url, description)
        VALUES ('New User', 'Address', 'pfp_url', 'cover_picture_url', 'Description')
        RETURNING id;
    `, (err, res) => {
            if (err) throw err;

            const userId = res.rows[0].id;

            client.query(`
            INSERT INTO levels (user_id, total, language, socials, meditation, code, sport)
            VALUES ($1, 0, 0, 0, 0, 0, 0);
        `, [userId], (err, res) => {
                if (err) throw err;

                console.log('New user with levels created successfully');
                client.end();
            });
        });

        // Insert the new user into the database
        const query = 'INSERT INTO users (username, address, pfp_url, cover_picture_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING id';
        const result = await client.query(query, [username, address, "", "", description]);

        // Extract the newly generated user ID from the query result
        const userId = result.rows[0].id;

        res.json({ message: 'User created successfully', userId });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router 
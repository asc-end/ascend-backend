import client from "../db";
import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", (req, res) => {
    if (req.query.address) {
        client.query(`SELECT * FROM users WHERE address = $1`, [req.query.address], (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        });
    }
    else {
        client.query("SELECT * FROM users", (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        });
    }
})

router.post("/set-user", (req, res) => {
    try {
        const { address, name, description, pfp_url, cover_picture_url } = req.body;

        console.log(address)
        let query = 'UPDATE users SET';
        const queryParams = [];
        let isFirstParam = true;
        if (description !== undefined) {
            query += `${isFirstParam ? ' ' : ', '}description = $${queryParams.length + 1}`;
            queryParams.push(description);
            isFirstParam = false;
        }
        if (name !== undefined) {
            query += `${isFirstParam ? ' ' : ', '}name = $${queryParams.length + 1}`;
            queryParams.push(name);
            isFirstParam = false;
        }
        if (pfp_url !== undefined) {
            query += `${isFirstParam ? ' ' : ', '}pfp_url = $${queryParams.length + 1}`;
            queryParams.push(pfp_url);
            isFirstParam = false;
        }
        if (cover_picture_url !== undefined) {
            query += `${isFirstParam ? ' ' : ', '}cover_picture_url = $${queryParams.length + 1}`;
            queryParams.push(cover_picture_url);
            isFirstParam = false;
        }
        // else {
        //     query += ', pfp_url = pfp_url';
        // }
        // else {
        //     query += ', cover_picture_url = cover_picture_url';
        // }

        if (!queryParams.length) {
            res.status(400).json({ error: "Please enter at least one param" });
            return;
        }
        console.log(queryParams)
        query += ` WHERE address = $${queryParams.length + 1}`;
        queryParams.push(address);
        const result = client.query(query, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating user description and name', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            console.log('User description and name updated successfully');
            res.json({ message: 'New user with levels created successfully' });
        })
    } catch (err) {
        console.error('Error updating user description and name:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.post('/new-user', async (req, res) => {
    try {
        const { name, address, description } = req.body;
        console.log(name)
        const query = "INSERT INTO users (name, address, pfp_url, cover_picture_url, description) SELECT $1, $2, $3, $4, $5 WHERE NOT EXISTS (SELECT 1 FROM users WHERE address = $2) RETURNING id"
        client.query(query, [name, address, "", "", description], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            const userId = result.rows[0].id;

            client.query(`
                INSERT INTO levels (user_id, total, language, socials, meditation, code, sport)
                VALUES ($1, 0, 0, 0, 0, 0, 0);
            `, [userId], (err, result) => {
                if (err) {
                    console.error('Error inserting levels:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }

                console.log('New user with levels created successfully');
                res.json({ message: 'New user with levels created successfully' });
            });
        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router 
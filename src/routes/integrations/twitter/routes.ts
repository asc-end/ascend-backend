import express from "express";
import { client } from "../../../config";
const router = express.Router();

router.post("/create", async (req, res) => {
    try {
        const { address, username, id } = req.body;

        // Check if profile already exists
        const checkQuery = "SELECT * FROM app_profiles WHERE address = $1 AND app = 'Twitter'";
        client.query(checkQuery, [address], (err, result) => {
            if (err) {
                console.error(err)
                res.status(500).json({ error: `Internal server error : ${err.message}` });
                return;
            }

            // If profile exists, return the id
            if (result.rows.length > 0) {
                res.status(200).json({ message: 'Github profile already exists.', fid: result.rows[0].fid });
                return;
            }

            // If profile doesn't exist, insert new profile
            const insertQuery = "INSERT INTO app_profiles (address, app_id, username, app) VALUES ($1, $2, $3, 'Twitter') RETURNING app_id";
            client.query(insertQuery, [address, id, username], (err, result) => {
                if (err) {
                    console.error(err)
                    res.status(500).json({ error: `Internal server error : ${err.message}` });
                    return;
                }
                res.status(200).json({ message: 'Github linked successfully.', appId: result.rows[0].app_id });
            })
        })
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: `Internal server error ${err}` });
    }
})

export { router as twitterRoutes }

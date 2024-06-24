import client from "../../lib/db";
import express from "express";

const router = express.Router();

router.delete("/", async (req, res) => {

    try {
        const { name } = req.query
        client.query(`
            DROP TABLE IF EXISTS ${name} CASCADE;
        `, (err, res) => {
            if (err) throw err;
        });
        res.status(200).json({message: `Table ${name} has been deleted.`})
    }
    catch (err) {
        console.error("Error fetching actual data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})

export default router



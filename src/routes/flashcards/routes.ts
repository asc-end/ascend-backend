import client from "../../lib/db";
import express from "express";

const router = express.Router();
export function importFromJson(data: {english: string, french: string, german: string, italian:string, portuguese: string, spanish: string}[]) {
    try{
        data.forEach((flashcard)=> {
            if(flashcard.french !== ""){
                const query = "INSERT INTO languagecards (english, french, german, italian, portuguese, spanish) SELECT $1, $2, $3, $4, $5, $6"
                client.query(query, [flashcard.english, flashcard.french, flashcard.german, flashcard.italian, flashcard.portuguese, flashcard.spanish], (err, result) => {
                    if (err) {
                        console.error('Error inserting user:', err);
                        return;
                    }
                });   
            }
        })

    }catch(e){
        console.log(e)
    }
}

router.get("/", async (req, res) => {
    try {


        client.query(`SELECT * FROM languagecards LIMIT 15`, (err, result) => {
            if (err) {
                console.error("Error fetching actual data:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(result.rows);
            }
        });

    }
    catch (err) {
        console.error("Error fetching actual data:", err);
        res.status(500).json({ error: "Internal server error" });
    }
})

export default router 



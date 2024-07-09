import express, { Request, Response } from "express";

const router = express.Router();

router.post("/", async (req, res) => {
    console.log(req.body)
    req.body.accountData.map((data:any) => console.log(data))
    res.status(200).json({message: "Received successfully."})
})

export default router 
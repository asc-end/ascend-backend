import express, { Request, Response } from "express";

const router = express.Router();

router.post("/", async (req, res) => {
    console.log(req.body)
    res.status(200).json({message: "Received successfully."})
})

export default router 
import client from "../db";
import express, { Request, Response } from "express";
import { create } from "./test";
const router = express.Router();


router.get("/", async (req, res) => {
    try {
        await create()
        res.status(200).json("Program well created")
    } catch (e) {
        console.log(e)
    }
})

export default router 

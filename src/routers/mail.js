import express from "express";
import { sendMail } from "../controllers/mail";

const router = express.Router()

router.post("/mail", sendMail)

export default router
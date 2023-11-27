import express from "express";
import { authorization } from "../middleware/authorization";
import { createVoucher, getAllVoucher, getVoucher, removeVoucher, updateVoucher } from "../controllers/vouchers";


const router = express.Router();

router.post("/vouchers", authorization, createVoucher);
router.get("/vouchers", authorization, getAllVoucher);
router.get("/vouchers/:id", authorization, getVoucher);
router.patch("/vouchers/:id", authorization, updateVoucher);
router.delete("/vouchers/:id", authorization, removeVoucher);

export default router;

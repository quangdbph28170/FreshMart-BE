import express from "express";
import { authorization } from "../middleware/authorization";
import { createVoucher, getAllVoucher, getVoucher, getVoucherUser, removeVoucher, updateVoucher, validateVoucher } from "../controllers/vouchers";
import authentication from "../middleware/authentication";


const router = express.Router();

router.post("/vouchers", authorization, createVoucher);
router.get("/vouchers", authorization, getAllVoucher);
router.post("/vouchers-user", authentication, getVoucherUser);
router.get("/vouchers/:id", authorization, getVoucher);
router.patch("/vouchers/:id", authorization, updateVoucher);
router.delete("/vouchers/:id", authorization, removeVoucher);
router.put("/vouchers/", authentication, validateVoucher);

export default router;

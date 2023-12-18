import express from "express";
import { authorization } from "../middleware/authorization";
import {
  createVoucher,
  getAllVoucher,
  getVoucher,
  getVoucherUser,
  removeVoucher,
  updateVoucher,
  validateVoucher,
} from "../controllers/vouchers";
import authentication from "../middleware/authentication";

const router = express.Router();

router.post("/vouchers", authentication, authorization, createVoucher);
router.get("/vouchers", authentication, authorization, getAllVoucher);
router.post("/vouchers-user", getVoucherUser);
router.get("/vouchers/:id", authentication, authorization, getVoucher);
router.patch("/vouchers/:id", authentication, authorization, updateVoucher);
router.delete("/vouchers/:id", authentication, authorization, removeVoucher);
router.put("/vouchers/", authentication, validateVoucher);

export default router;

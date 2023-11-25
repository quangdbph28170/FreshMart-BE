import { Router } from "express";
import { vnpayCreate, vnpayIpn, vnpayReturn } from "../controllers/vnpay";

const router = Router();

router.post('/create_payment_url', vnpayCreate);
router.get('/vnpay_ipn', vnpayIpn);
router.get('/vnpay_return', vnpayReturn);
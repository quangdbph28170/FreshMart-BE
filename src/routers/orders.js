import express from "express";
import {
    UpdateOrder, FilterOrdersForMember,
    GetAllOrders, CanceledOrder, CreateOrder,
    OrderDetail, OrdersForGuest, OrdersForMember,
} from "../controllers/orders";

const router = express.Router();

router.post("/orders", CreateOrder);
router.get("/orders", GetAllOrders);
router.get("/orders-guest", OrdersForGuest);
router.get("/orders-member", OrdersForMember);
router.get("/orders-member-filter", FilterOrdersForMember);
router.get("/orders/:id", OrderDetail);
router.put("/orders/:id", CanceledOrder);
router.patch("/orders/:id", UpdateOrder);

export default router;

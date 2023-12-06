import express from "express";
import dotenv from "dotenv";
import User from "../models/user";
import {
  UpdateOrder,
  FilterOrdersForMember,
  GetAllOrders,
  CanceledOrder,
  CreateOrder,
  OrderDetail,
  OrdersForMember,
  OrdersForGuest,
  ConfirmOrder,

} from "../controllers/orders";
import authentication from "../middleware/authentication";
import jwt from "jsonwebtoken";
import { authorization } from "../middleware/authorization";

dotenv.config();
const router = express.Router();

router.post(
  "/orders",
  async (req, res, next) => {
    const token = req.cookies?.refreshToken;
    // console.log(token);
    if (!token) {
      req.user = null;
      next();
      return;
    }
    jwt.verify(
      token,
      process.env.SERECT_REFRESHTOKEN_KEY,
      async (err, payload) => {
        if (err) {
          if (err.name == "JsonWebTokenError") {
            return res.status(402).json({
              message: "Refresh Token is invalid", //rf token ko hợp lệ
            });
          }
          if (err.name == "TokenExpiredError") {
            return res.status(403).json({
              message: "Refresh Token is expired ! Login again please !", //rf token hết hạn
            });
          }
        }
        const user = await User.findById(payload._id);
        req.user = user;
        next();
        
      }
    );
  },
  CreateOrder,
);
router.get("/orders", GetAllOrders);
router.post("/orders-guest", OrdersForGuest);
router.get("/orders-member", authentication, OrdersForMember);
router.get("/orders-member-filter", authentication, FilterOrdersForMember);
router.get("/orders/:id", OrderDetail);
router.put("/orders/:id", CanceledOrder);
router.put("/orders-cofirm/:id", ConfirmOrder);
router.patch("/orders/:id", authentication, authorization, UpdateOrder);

export default router;

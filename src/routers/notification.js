import express from "express";
import {
  deleteNotification,
  updateStatusNotification
} from "../controllers/notification";

const router = express.Router();
router.patch("/notification/:id", updateStatusNotification);
router.delete("/notification/:id", deleteNotification);
export default router;

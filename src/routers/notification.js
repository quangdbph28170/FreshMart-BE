import express from "express";
import {
  deleteNotification,
  getAdminNotification,
  getClientNotification,
  updateStatusNotification
} from "../controllers/notification";

const router = express.Router();
router.get("/notification-client/:id", getClientNotification);
router.get("/notification-admin", getAdminNotification);
router.patch("/notification/:id", updateStatusNotification);
router.delete("/notification/:id", deleteNotification);
export default router;

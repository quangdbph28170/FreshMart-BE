import express from "express";
import {
  updateStatusNotification
} from "../controllers/notification";

const router = express.Router();
router.patch("/notification/:id", updateStatusNotification);
export default router;

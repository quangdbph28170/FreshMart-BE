import express from "express";

import { authorization } from "../middleware/authorization";
import { getUnsoldProduct, getUnsoldProducts } from "../controllers/unsoldProducts";

const router = express.Router();
router.get("/unsoldProducts", authorization,getUnsoldProducts);
router.get("/unsoldProducts/:id", authorization,getUnsoldProduct)

export default router;

import express from "express";

import { authorization } from "../middleware/authorization";
import { getUnsoldProduct, getUnsoldProducts } from "../controllers/unsoldProducts";
import authentication from "../middleware/authentication";

const router = express.Router();
router.get("/unsoldProducts", authentication, authorization, getUnsoldProducts);
router.get("/unsoldProducts/:id", authentication, authorization, getUnsoldProduct)

export default router;

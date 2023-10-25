import express from "express";
import {
  createProduct,
  getProducts,
  getOneProduct,
  updateProduct,
  removeProduct,
  getRelatedProducts,
} from "../controllers/products";

const router = express.Router();
router.post("/products", createProduct);
router.patch("/products/:id", updateProduct);
router.get("/products", getProducts);
router.get("/products/related/:cate_id/:product_id", getRelatedProducts);
router.get("/products/:id", getOneProduct);
router.delete("/products/:id", removeProduct);
export default router;

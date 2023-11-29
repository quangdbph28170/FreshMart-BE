import express from "express";
import {
  createProduct,
  getProducts,
  getOneProduct,
  updateProduct,
  removeProduct,
  getRelatedProducts,
  getProductSold,
  productClearance,
} from "../controllers/products";
import { authorization } from "../middleware/authorization";

const router = express.Router();
router.post("/products", authorization,createProduct);
router.patch("/products/:id", authorization,updateProduct);
router.get("/products", getProducts);
router.get("/products-sold", getProductSold);
router.get("/products/related/:cate_id/:product_id", getRelatedProducts);
router.get("/products/:id", getOneProduct);
router.delete("/products/:id", authorization,removeProduct);
router.post("/products-process/", authorization,productClearance);
export default router;

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
import authentication from "../middleware/authentication";

const router = express.Router();
router.post("/products", authentication, authorization, createProduct);
router.patch("/products/:id", authentication, authorization, updateProduct);
router.get("/products", getProducts);
router.get("/products-sold", getProductSold);
router.get("/products/related/:cate_id/:product_id", getRelatedProducts);
router.get("/products/:id", getOneProduct);
router.delete("/products/:id", authentication, authorization, removeProduct);
router.post("/products-process/", authentication, authorization, productClearance);
export default router;

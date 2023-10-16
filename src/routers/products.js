import express from 'express';
import {
   createProduct, getProducts, getOneProduct, updateProduct, removeProduct
} from '../controllers/products';
import { responseSender } from '../middleware/configResponse';
const router = express.Router();
router.post('/product', createProduct);
router.patch('/product/:id', updateProduct);
router.get('/products', getProducts);
router.get('/product/:id', getOneProduct);
router.delete('/product/:id', removeProduct);
export default router;
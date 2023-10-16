import express from 'express';
import {
   getAllCategory,
   createCategory,
   getOneCategory,
   removeCategories,
   updateCategory,
} from '../controllers/categories';
import { responseSender } from '../middleware/configResponse';
const router = express.Router();
router.post('/categories', createCategory, responseSender);
router.patch('/categories/:id', updateCategory, responseSender);
router.delete('/categories/:id', removeCategories, responseSender);
router.get('/categories/:id', getOneCategory, responseSender);
router.get('/categories', getAllCategory, responseSender);
export default router;
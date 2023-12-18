import express from 'express';
import {
   getAllCategory,
   createCategory,
   getOneCategory,
   removeCategories,
   updateCategory,
} from '../controllers/categories';
import { responseSender } from '../middleware/configResponse';
import authentication from '../middleware/authentication';
import { authorization } from '../middleware/authorization';
const router = express.Router();
router.post('/categories', authentication, authorization, createCategory, responseSender);
router.patch('/categories/:id', authentication, authorization, updateCategory, responseSender);
router.delete('/categories/:id', authentication, authorization, removeCategories, responseSender);
router.get('/categories/:id', getOneCategory, responseSender);
router.get('/categories', getAllCategory, responseSender);
export default router;
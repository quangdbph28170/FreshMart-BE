import express from 'express';
import { createOrigin, findAll, findOne, removeOrigin, updateOrigin } from '../controllers/origin';
const router = express.Router();

router.post('/origin', createOrigin);
router.patch('/origin/:id', updateOrigin);
router.delete('/origin/:id', removeOrigin);
router.get('/origin/:id', findOne);
router.get('/origin', findAll);

export default router;
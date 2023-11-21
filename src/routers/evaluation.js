import express from 'express';
import authentication from '../middleware/authentication';
import { createEvaluation, getIsRatedByProductId, getIsRatedDetail, isReviewVisible } from '../controllers/evaluation';
import { authorization } from '../middleware/authorization';


const router = express.Router();
router.post('/evaluation', authentication, createEvaluation);
router.get('/evaluationByProductId/:id', getIsRatedByProductId);
router.get('/evaluation/:id', getIsRatedDetail);
router.patch('/evaluation/:id', authorization,isReviewVisible);

export default router;
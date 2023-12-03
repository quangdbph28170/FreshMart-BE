import express from 'express';
import { getAllUsers, getOneUser, createUser, updateUser } from '../controllers/user';
import { responseSender } from '../middleware/configResponse';
import authentication from '../middleware/authentication';
import { generateVerificationToken, verifyToken, forgotPassword } from '../controllers/forgotPassword';

const router = express.Router();

router.get('/users', authentication, getAllUsers, responseSender);
router.get('/users/:id', authentication, getOneUser, responseSender);
router.post('/users', authentication, createUser, responseSender);
router.patch('/users/:id', authentication, updateUser, responseSender);

router.post('/generateVerificationToken', generateVerificationToken);
router.post('/verifyToken', verifyToken);
router.put('/forgotPassword', forgotPassword);

export default router;

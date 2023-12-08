import express from 'express';
import {
    getAllUsers, getOneUser, createUser, updateUser,
    generateVerificationToken, verifyToken, forgotPassword, changePassword
} from '../controllers/user';
import { responseSender } from '../middleware/configResponse';
import authentication from '../middleware/authentication';


const router = express.Router();

router.get('/users', authentication, getAllUsers, responseSender);
router.get('/users/:id', authentication, getOneUser, responseSender);
router.post('/users', authentication, createUser, responseSender);
router.patch('/users/:id', authentication, updateUser, responseSender);

router.post('/generateVerificationToken', generateVerificationToken);
router.post('/verifyToken', verifyToken);
router.put('/forgotPassword', forgotPassword);
router.patch('/changePassword',authentication, changePassword);

export default router;

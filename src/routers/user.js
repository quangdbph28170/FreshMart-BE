import express from 'express';
import { getAllUsers, getOneUser, createUser, updateUser } from '../controllers/user';
import { responseSender } from '../middleware/configResponse';
import { generateVerificationToken , verifyToken ,forgotPassword} from '../controllers/forgotPassword';

const router = express.Router();

router.get('/users', getAllUsers, responseSender);
router.get('/users/:id', getOneUser, responseSender);
router.post('/users', createUser, responseSender);
router.patch('/users/:id', updateUser, responseSender);
router.post('/generateVerificationToken',generateVerificationToken );
router.post('/verifyToken',verifyToken);
router.put('/forgotPassword',forgotPassword);

export default router;

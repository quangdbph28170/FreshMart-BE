import express from 'express';
import { addMessage, getAllChat, getOneChatByRoomId, getOneChatByRoomIdForUser, updateChatRoom, updateIsReadForUser } from '../controllers/chat';
import authentication from '../middleware/authentication';
const router = express.Router();

router.post('/chat', authentication,addMessage);
router.get('/chat',authentication,getAllChat );
router.get('/chat/:id',authentication,getOneChatByRoomId);
router.patch('/chat', authentication,updateChatRoom );
router.get('/chat-user/:id', authentication,getOneChatByRoomIdForUser );
router.patch('/chat/:id', authentication,updateIsReadForUser );
export default router;
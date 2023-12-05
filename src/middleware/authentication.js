import User from '../models/user';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const authentication = async (req, res, next) => {
   try {
    
      const rfToken = req.cookies.refreshToken;
      if(!rfToken) {
         return res.status(402).json({
            status: 402,
            message: 'You need to login', //rf token hết hạn
         });
      }
      jwt.verify(rfToken, process.env.SERECT_REFRESHTOKEN_KEY, async (err, payload) => {
         if (err) {
            if (err.name == 'JsonWebTokenError') {
               return res.status(402).json({
                  status: 402,
                  message: 'Refresh Token is invalid', //rf token ko hợp lệ
               });
            }
            if (err.name == 'TokenExpiredError') {
               return res.status(402).json({
                  status: 402,
                  message: 'Refresh Token is expired ! Login again please !', //rf token hết hạn
               });
            }
         }
            const user = await User.findById(payload._id);
            req.user = user;
            // console.log(req.user);
            next();
         });
         // console.log(req.user);
     
   } catch (error) {
      return res.status(400).json({
         message: error.message,
      });
   }
};
export default authentication;
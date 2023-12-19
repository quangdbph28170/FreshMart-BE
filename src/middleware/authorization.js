import jwt from 'jsonwebtoken';
import User from '../models/user'
import dotenv from 'dotenv';
dotenv.config()

export const authorization = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken
        if(!token) {
            return res.status(402).json({
               status: 402,
               message: 'Refresh Token is expired ! Login again please !', //rf token hết hạn
            });
         }
        const { _id } = jwt.verify(token, process.env.SERECT_REFRESHTOKEN_KEY)
        const user = await User.findById(_id)
        if(!user) {
            return res.status(402).json({
                status: 402,
                message: 'Invalid authorization'
            })
        }    
        if(user.role !== 'admin') {
            return res.status(402).json({
                status: 402,
                message: 'You are not allowed to access this application'
            })
        }
        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({
            error: error.message
        })
    }
}
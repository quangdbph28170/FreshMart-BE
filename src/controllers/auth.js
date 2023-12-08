import User from '../models/user';
import Chat from '../models/chat';
import { signinSchema, singupSchema } from '../validation/auth';
import bcrypt from 'bcrypt';
import jwt, { decode } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { typeRequestMw } from '../middleware/configResponse';
import e from 'express';

dotenv.config();
const { RESPONSE_MESSAGE, RESPONSE_STATUS, RESPONSE_OBJ } = typeRequestMw;

export const validateUser = async (detail) => {
   const user = await User.findOne({ email: detail.email });

   if (user) {
      const chatExist = await Chat.findOne({ roomChatId: user._id })

      if (!chatExist) {
         await Chat.create({
            roomChatId: user._id,
            messages: [{
               content: "Chào mừng bạn đến với Fresh Mart",
               sender: "admin",
               isRead: "false"
            }]
         })
      }
   }

   if (user) return user;

   // Tạo mật khẩu ngẫu nhiên cho người dùng
   const randomPassword = Math.random().toString(36).slice(-8);
   const hashedPassword = await bcrypt.hash(randomPassword, 10);

   const newUser = await User.create({
      email: detail.email,
      userName: detail.userName,
      avatar: detail.picture,
      password: hashedPassword,
   });

   const chatExist = await Chat.findOne({ roomChatId: newUser._id })

   if (!chatExist) {
      await Chat.create({
         roomChatId: newUser._id,
         messages: [{
            content: "Chào mừng bạn đến với Fresh Mart",
            sender: "admin",
            isRead: "false"
         }]
      })
   }

   return newUser;
};

export const signUp = async (req, res, next) => {
   try {
      const { error } = singupSchema.validate(req.body, { abortEarly: false });

      if (error) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Form error: ${error.details[0].message}`;
         return next();
      }

      const userExist = await User.findOne({ email: req.body.email });
      if (userExist) {
         req[RESPONSE_STATUS] = 400;
         req[RESPONSE_MESSAGE] = `Email này đã được sử dụng`;
         return next();
      }

      const hashPassword = await bcrypt.hash(req.body.password, 10);

      const user = await User.create({
         ...req.body,
         password: hashPassword,
      });
      if (!user) {
         req[RESPONSE_STATUS] = 401;
         req[RESPONSE_MESSAGE] = `Quá trình đăng ký bị lỗi! Vui lòng thử lại sau`;
         return next();
      }

      const refreshToken = jwt.sign({ _id: user._id }, process.env.SERECT_REFRESHTOKEN_KEY, {
         expiresIn: '1d',
      });

      const accessToken = jwt.sign({ _id: user._id }, process.env.SERECT_ACCESSTOKEN_KEY, {
         expiresIn: '5m',
      });

      res.cookie('accessToken', accessToken, {
         expires: new Date(Date.now() + 5 * 60 * 1000),
         httpOnly: true,
      });
      res.cookie('refreshToken', refreshToken, {
         expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
         httpOnly: true,
      });
      const chatExist = await Chat.findOne({ roomChatId: user._id })

      if (!chatExist) {
         await Chat.create({
            roomChatId: user._id,
            messages: [{
               content: "Chào mừng bạn đến với Fresh Mart",
               sender: "admin",
               isRead: "false"
            }]
         })
      }

      user.password = undefined;

      req[RESPONSE_OBJ] = {
         accessToken,
         expires: 10 * 60 * 1000,
         data: user,
      };
      return next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Form error: ${error.message}`;
      return next();
   }
};

export const signIn = async (req, res, next) => {
   try {
      const { error } = signinSchema.validate(req.body, { abortEarly: false });

      if (error) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Form error: ${error.details[0].message}`;
         return next();
      }

      const user = await User.findOne({ email: req.body.email });
      if (!user) {
         req[RESPONSE_STATUS] = 404;
         req[RESPONSE_MESSAGE] = `Email này chưa được đăng ký`;
         return next();
      }

      if (!user.state) {
         req[RESPONSE_STATUS] = 403;
         req[RESPONSE_MESSAGE] = `Email này đã bị vô hiệu hóa`;
         return next();
      }

      const validPass = await bcrypt.compare(req.body.password, user.password);
      if (!validPass) {
         req[RESPONSE_STATUS] = 400;
         req[RESPONSE_MESSAGE] = `Mật khẩu không trùng khớp`;
         return next();
      }

      if (!user) {
         req[RESPONSE_STATUS] = 401;
         req[RESPONSE_MESSAGE] = `Quá trình đăng nhập bị lỗi! vui lòng thử lại sau`;
         return next();
      }
      const refreshToken = jwt.sign({ _id: user._id }, process.env.SERECT_REFRESHTOKEN_KEY, {
         expiresIn: '1d',
      });

      const accessToken = jwt.sign({ _id: user._id }, process.env.SERECT_ACCESSTOKEN_KEY, {
         expiresIn: '5m',
      });
      res.cookie('accessToken', accessToken, {
         expires: new Date(Date.now() + 5 * 60 * 1000),
         httpOnly: true,
      });
      res.cookie('refreshToken', refreshToken, {
         expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
         httpOnly: true,
      });

      const chatExist = await Chat.findOne({ roomChatId: user._id })

      if (!chatExist) {
         await Chat.create({
            roomChatId: user._id,
            messages: [{
               content: "Chào mừng bạn đến với Fresh Mart",
               sender: "admin",
               isRead: "false"
            }]
         })
      }

      user.password = undefined;

      req[RESPONSE_OBJ] = {
         accessToken,
         expires: 10 * 60 * 1000,
         data: user,
      };
      return next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Form error: ${error.message}`;
      return next();
   }
};

export const redirect = (req, res) => {
   if (req.user?.data.state) {
      res.cookie('accessToken', req.user?.accessToken, {
         expires: new Date(Date.now() + 60 * 1000),
         httpOnly: true,
      });
      res.cookie('refreshToken', req.user?.refreshToken, {
         expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
         httpOnly: true,
      });
      // Successful authentication, redirect success.
      res.redirect(process.env.GOOGLE_REDIRECT_URL);
   } else {
      // Successful authentication, redirect success.
      res.redirect(process.env.GOOGLE_REDIRECT_URL + '?err=');
   }
};

export const refresh = async (req, res, next) => {
   try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
         req[RESPONSE_OBJ] = {
            accessToken: "",
            data: {},
         };
         return next();
      }
      jwt.verify(refreshToken, process.env.SERECT_REFRESHTOKEN_KEY, async (err, decode) => {
         if (err) {
            req[RESPONSE_STATUS] = 400;
            req[RESPONSE_MESSAGE] = `Form error: ${err}`;
            return next();
         } else {
            const user = await User.findById(decode._id);
            if (!user) {
               req[RESPONSE_STATUS] = 400;
               req[RESPONSE_MESSAGE] = `Form error: not found account`;
               return next();
            }
            const accessToken = jwt.sign({ _id: user._id }, process.env.SERECT_ACCESSTOKEN_KEY, {
               expiresIn: '1m',
            });
            res.cookie('accessToken', accessToken, {
               expires: new Date(Date.now() + 5 * 60 * 1000),
               httpOnly: true,
            });
            req[RESPONSE_OBJ] = {
               accessToken,
               expires: 10 * 60 * 1000,
               data: user,
            };
            return next();
         }
      });
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Form error: ${error.message}`;
      return next();
   }
};

export const clearToken = async (req, res, next) => {
   try {
      const token = req.cookies.refreshToken;
      if (!token) {
         req[RESPONSE_STATUS] = 404;
         req[RESPONSE_MESSAGE] = `Form error: No token available`;
         return next();
      }

      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');

      req[RESPONSE_MESSAGE] = `Token has been cleared`;
      return next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Form error: ${error.message}`;
      return next();
   }
};

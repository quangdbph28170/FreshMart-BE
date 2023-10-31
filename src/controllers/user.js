import { typeRequestMw } from '../middleware/configResponse';
import User from '../models/user';
import { userSchema } from '../schemas/auth';
import bcrypt from 'bcrypt';

const { RESPONSE_MESSAGE, RESPONSE_STATUS, RESPONSE_OBJ } = typeRequestMw;

export const getAllUsers = async (req, res, next) => {
   try {
      const { _sort = 'createAt', _order = 'asc', _limit = 100000, _page = 1, _q = '' } = req.query;
      const options = {
         page: _page,
         sort: {
            [_sort]: _order === 'desc' ? -1 : 1,
         },
         collation: { locale: 'vi', strength: 1 },
      };
      
      if (_limit !== undefined) {
         options.limit = _limit;
      }
      const optionsSearch = _q !== '' ? { $or: [
         { userName: { $regex: _q, $options: 'i' } },
     ] } : {};
      
      const users = await User.paginate({ ...optionsSearch }, { ...options });

      if (users.docs.length === 0) {
         req[RESPONSE_STATUS] = 404;
         req[RESPONSE_MESSAGE] = `Form error: No users found`;
         return next();
      }

      req[RESPONSE_OBJ] = users;
      return next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Form error: ${error.message}`;
      return next();
   }
};

export const getOneUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if(!user) {
            req[RESPONSE_STATUS] = 404;
            req[RESPONSE_MESSAGE] = `Form error: User not found`;
            return next();
        }

        req[RESPONSE_OBJ] = user
        next();
    } catch (error) {
        req[RESPONSE_STATUS] = 500;
        req[RESPONSE_MESSAGE] = `Form error: ${error.message}`;
        return next();
    }
}

export const createUser = async (req, res, next) => {
   try {
      const { error } = userSchema.validate(req.body);
      if (error) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Form error: ${error.details[0].message}`;
         return next();
      }
      const hashPassword = await bcrypt.hash(req.body.password, 10);
      const user = await User.create({
         ...req.body,
         password: hashPassword
      });
      if (!user) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Form error: create user failed`;
         return next();
      }

      req[RESPONSE_OBJ] = user;
      next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Form error: ${error.message}`;
      return next();
   }
};

export const updateUser = async (req, res, next) => {
   try {
      const { error } = userSchema.validate(req.body);
      if (error) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Form error: ${error.details[0].message}`;
         return next();
      }
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Form error: User not available to update`;
         return next();
      }

      const newUser = await User.findByIdAndUpdate(id, req.body);

      req[RESPONSE_OBJ] = newUser;
      next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Form error: ${error.message}`;
      return next();
   }
};

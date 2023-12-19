import joi from 'joi';

export const singupSchema = joi.object({
   userName: joi.string().required().messages({
      "string.empty": "Phải nhập tên người dùng",
      "string.required": "Trường tên là bắt buộc",
   }),
   email: joi.string().email().required().messages({
      "string.email": "Email không hợp lệ",
      "string.empty": "Email không được để trống",
      "string.required": "Trường email là bắt buộc",
   }),
   phoneNumber: joi.string().regex(/^(0[2-9])\d{7,11}$/).allow('').message('Số điện thoại không đúng định dạng'),
   address: joi.string().allow(''),
   password: joi.string().required().min(6).messages({
      "string.empty": "Phải nhập mật khẩu",
      "string.required": "Trường mật khẩu là bắt buộc",
      "string.min": "Mật khẩu phải ít nhất {#limit} ký tự",
   }),
   confirmPassword: joi.string().required().valid(joi.ref('password')).messages({
      "string.empty": "Phải nhập lại mật khẩu",
      "string.required": "Phải nhập lại mật khẩu",
      "any.only": "Mật khẩu nhập lại không khớp",
  }),
});

export const signinSchema = joi.object({
   email: joi.string().email().required().messages({
      "string.email": "Email không hợp lệ",
      "string.empty": "Email không được để trống",
      "string.required": "Trường email là bắt buộc",
   }),
   password: joi.string().required().min(6).messages({
      "string.empty": "Phải nhập mật khẩu",
      "string.required": "Trường mật khẩu là bắt buộc",
      "string.min": "Mật khẩu phải ít nhất {#limit} ký tự",
   }),
});

export const userSchema = joi.object({
   userName: joi.string().required(),
   email: joi.string().email().required(),
   password: joi.string(),
   phoneNumber: joi.string(),
   address: joi.string(),
   avatar: joi
      .string()
      .default(
         'https://lh5.googleusercontent.com/x14nnYSvR1c8KkO6Kj1giR4iZcQL0UelyqcGBRFt8fHQg8sRUouMkFc3b_F-kmDLDW-qpDo8KkBpuXGnfUNjy6NZVqwAcBYnngbupNd2scJqGyNpjYTGQZdfY3ktqFJZNsKfXR-YrDmqrcQwOrM4k2M',
      ),
   role: joi.string().valid('admin', 'member').default('member'),
   state: joi.boolean().default(true),
});

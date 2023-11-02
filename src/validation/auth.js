import joi from 'joi';

export const singupSchema = joi.object({
   userName: joi.string().required(),
   email: joi.string().email().required(),
   phoneNumber: joi.string(),
   address: joi.string(),
   password: joi.string().required().min(6),
   confirmPassword: joi.string().valid(joi.ref('password')).required(),
});

export const signinSchema = joi.object({
   email: joi.string().email().required(),
   password: joi.string().required().min(6),
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

import joi from 'joi';

export const forgotPasswordSchema = joi.object({
    password: joi.string().required().min(6),
    confirmPassword: joi.string().valid(joi.ref('password')).required(),
});

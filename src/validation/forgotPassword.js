import joi from 'joi';

export const forgotPasswordSchema = joi.object({
    password: joi.string().required().min(6),
    confirmPassword: joi.string().valid(joi.ref('password')).required(),
});
export const changePasswordSchema = joi.object({
    currentPassword: joi.string().required().min(6),
    password: joi.string().required().min(6),
    confirmPassword: joi.string().valid(joi.ref('password')).required(),
});

import joi from 'joi';

export const validateMail = joi.object({
    email : joi.string().required().trim().email(),
    subject: joi.string().required().trim(),
    content: joi.string().required().trim(),
     
})
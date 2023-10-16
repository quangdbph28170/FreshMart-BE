import joi from 'joi';

export const categorySchema = joi.object({
   cateName: joi.string().required().trim(),
   image: joi.string().required().trim(),
   type: joi.string(),
});
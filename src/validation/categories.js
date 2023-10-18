import joi from 'joi';

export const categorySchema = joi.object({
   cateName: joi.string().required().trim(),
   image: joi.object({
      url: joi.string().required(),
      public_id: joi.string().required(),
   }),
   type: joi.string(),
});
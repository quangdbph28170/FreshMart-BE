import joi from 'joi';

export const categorySchema = joi.object({
   cateName: joi.string().required().trim(),
   images: joi
    .array()
    .items(
      joi.object({
        url: joi.string().required(),
        public_id: joi.string().required(),
      })
    )
    .required(),
   type: joi.string(),
});
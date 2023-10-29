import joi from 'joi';

export const originSchema = joi.object({
   name: joi.string().required().trim(),
});
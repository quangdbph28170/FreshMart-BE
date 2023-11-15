import joi from "joi";

export const categorySchema = joi.object({
  cateName: joi.string().required().trim(),
  image: joi.object({
    url: joi.string(),
    public_id: joi.string(),
  }),
  type: joi.string(),
  products: joi.array(),
});

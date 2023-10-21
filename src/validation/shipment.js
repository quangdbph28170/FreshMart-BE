import joi from "joi";

export const validateShipment = joi.object({
  isDisabled: joi.boolean().default(false),
  totalMoney: joi.number().default(0).required(),
  products: joi.array().items(
    joi.object({
      idProduct: joi.string().required(),
      date: joi.string().required(),
      weight: joi.number().required(),
      price: joi.number().required(),
      origin: joi.string().required(),
    })
  ).default([])
});
import joi from "joi";

export const validateShipment = joi.object({
  isDisable: joi.boolean().default(false),
  totalMoney: joi.number().default(0).required(),
  products: joi
    .array()
    .items(
      joi.object({
        idProduct: joi.string().required(),
        productName: joi.string().required(),
        date: joi.string().required(),
        weight: joi.number().required(),
        originPrice: joi.number().required(),
      })
    )
    .required(),
});

export const validateUpdateShipment = joi.object({
  isDisable: joi.boolean().default(false),
});

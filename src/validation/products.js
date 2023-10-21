import joi from "joi";

export const validateProduct = joi.object({
  productName: joi.string().required().trim(),
  images: joi
    .array()
    .items(
      joi.object({
        url: joi.string().required(),
        public_id: joi.string().required(),
      })
    )
    .required(),
  desc: joi.string().required().trim(),
  categoryId: joi.string().required().trim(),
  discount: joi.number().required(),
  shipments: joi.array().items(
    joi.object({
      idShipment: joi.string().required(),
      weight: joi.number().required(),
      date: joi.string().required(),
      price: joi.number().required(),
      _id: joi.string().required(),
    })
  ),
});

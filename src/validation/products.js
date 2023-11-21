import joi from "joi";

export const validateProduct = joi.object({
  productName: joi.string().required().trim(),
  price: joi.number().required(),
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
  originId: joi.string().required().trim(),
  discount: joi.number().required(),
  isSale: joi.boolean().required(),
});
export const validateLiquidationProduct = joi.object({
  productName: joi.string().required().trim(),
  _productId: joi.string().required().trim(),
  _shipmentId: joi.string().required().trim(),
  discount: joi.number().required(),

});
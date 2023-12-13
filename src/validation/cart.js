import joi from "joi";

export const cartValid = joi.object({
  products: joi.array().items(
    joi.object({
      productId: {
        _id: joi.string().required().trim(),
        productName: joi.string().required().trim(),
        images: joi.array().items(
          joi.object({
            url: joi.string().required().trim(),
          })
        ),
        price: joi.number().required(),
        originId: {
          _id: joi.string().required().trim(),
        },
        isSale: joi.boolean(),
      },
      weight: joi.number().required(),
      totalWeight: joi.number().allow(),
    })
  ),
});

export const cartDB = joi.object({
  productId: joi.string().required(),
  weight: joi.number().required(),
  productName: joi.string().required(),
});

import joi from "joi"

export const cartValid = joi.object({
    products: joi.array().items(
        joi.object({
            productId: {
                _id: joi.string().required().trim(),
                productName: joi.string().required().trim(),
                images: joi.string().required().trim(),
                price: joi.number().required(),
            },
            weight: joi.number().required(),
        })
    )
})
import joi from "joi"

export const cartValid = joi.object({
    products: joi.array().items(
        joi.object({
            productId: joi.string().required().trim().empty(),
            productName: joi.string().required().trim().empty(),
            images: joi.string().required().trim().empty(),
            price: joi.number().required().empty(),
            weight: joi.number().required().empty(),
        })
    )
})
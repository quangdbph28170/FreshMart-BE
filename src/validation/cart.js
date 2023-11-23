import joi from "joi"

export const cartValid = joi.object({
    products: joi.array().items(
        joi.object({
            productId: {
                _id: joi.string().required().trim(),
                productName: joi.string().required().trim(),
                images: joi.array.items(
                    joi.object({
                        url: joi.string().required().trim(),
                    })
                ),
                price: joi.number().required(),
                originId: joi.items(
                    joi.object({
                        _id: joi.string().required().trim()
                    })
                ).required()
            },
            weight: joi.number().required(),
            totalWeight: joi.number().allow(),
        })
    )
})
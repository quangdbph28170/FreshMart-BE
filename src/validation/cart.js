import joi from "joi"

export const cartValid = joi.object({
    products: joi.array().items(
        joi.object({
            _id: joi.string().required().trim().empty(),
            name: joi.string().required().trim().empty(),
            images: joi.string().required().trim().empty(),
            price: joi.number().required().empty(),
            weight: joi.number().required().empty(),
            totalWeight: joi.number().empty(),
        })
    )
})
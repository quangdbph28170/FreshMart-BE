import joi from "joi"

export const validateProduct = joi.object({
    productName: joi.string().required().trim(),
    imgUrl: joi.string().required().trim(),
    price: joi.string().required().trim(),
    desc: joi.string().required().trim(),
    categoryId: joi.string().required().trim(),

})

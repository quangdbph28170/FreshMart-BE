import joi from 'joi';

export const validateEvaluation = joi.object({
    star: joi.number().required(),
    content: joi.string().allow(),
    imgUrl: joi.string().allow(),
    productId: joi.string().required().trim(),
    orderId: joi.string().required().trim(),

})
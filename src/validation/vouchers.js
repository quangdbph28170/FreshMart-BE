import Joi from 'joi';

 export const voucherValid = Joi.object({
    title: Joi.string().required(),
    code: Joi.string().required(),
    discount: Joi.number().required().max(100).min(0),
    condition: Joi.number().required(),
    quantity: Joi.number().required(),
    date_end: Joi.date().required(),
    status: Joi.boolean().default(true),
});

export default voucherValid;
import Joi from 'joi';

 export const voucherValid = Joi.object({
    title: Joi.string().required(),
    code: Joi.string().required(),
    percent: Joi.number().required().max(100).min(1),
    miniMumOrder: Joi.number().min(0).allow(),
    quantity: Joi.number().required().min(0),
    dateStart: Joi.date().required(),
    dateEnd: Joi.date().required(),
    status: Joi.boolean().default(true),
    maxReduce: Joi.number().allow().min(0),
    
});

export default voucherValid;
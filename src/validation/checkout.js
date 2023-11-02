import joi from "joi"

const formatPhoneNumber = /^0+[0-9]{9}$/

export const validateCheckout = joi.object({
    customerName: joi.string().required().trim().messages({
        "string.required": "CustomerName is required",
        "string.empty": "CustomerName is not empty!"
    }),
    phoneNumber: joi.string().required().pattern(formatPhoneNumber).trim().messages({
        "string.required": "PhoneNumber is required",
        "string.pattern.base": "Please enter a valid phone number!",
        "string.empty": "Phone number is not empty!"
    }),
    email: joi.string().required().email().trim().messages({
        "string.required": "Email is required",
        "string.email": "Please enter a valid email!",
        "string.empty": "Email is not empty!"
    }),
    shippingAddress: joi.string().required().trim().messages({
        "string.required": "ShippingAddress is required",
        "string.empty": "ShippingAddress is not empty!"
    }),
    products:joi.array().items(joi.object({
        _id:joi.string().required().trim(),
        name:joi.string().required().trim(),
        price:joi.number().required(),
        weight:joi.number().required(),
       totalWeight:joi.number()
    })),
    totalPayment:joi.number().required(),
    note:joi.string().trim()
})


export const validatePhoneAndMail = joi.object({
    phoneNumber: joi.string().pattern(formatPhoneNumber).trim().messages({
        "string.pattern.base": "Please enter a valid phone number!",
        "string.empty": "Phone number is not empty!"
    }),
    email: joi.string().email().trim().empty().messages({
        "string.email": "Please enter a valid email!",
        "string.empty": "Email is not empty!"
    }),
}).or("phoneNumber", "email").messages({ "object.missing": "Please enter a valid 'phoneNumber' or 'email'!" })
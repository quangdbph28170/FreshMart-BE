import Joi from "joi";
import Voucher from "../models/vouchers"
import voucherValid from "../validation/vouchers";

const voucherSchema = Joi.object({
    code: Joi.string().required()
})

export const validateVoucher = async (req, res, next) => {
    try {
        const { error } = voucherSchema.validate(re.body, { abortEarly: false })
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}
export const createVoucher = async (req, res) => {
    try {
        const { error } = voucherValid.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }
        const voucherExist = await Voucher.findOne({code:req.body.code})
        if(voucherExist){
            return res.status(400).json({
                status: 400,
                message: "This code has existed!"
            })
        }
        if( new Date(req.body.dateStart) > new Date(req.body.dateEnd)){
            return res.status(400).json({
                status: 400,
                message: "Date invalid",
               
            })
        }
        const data = await Voucher.create(req.body)
        return res.status(201).json({
            status: 201,
            message: "success",
            body: { data }
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}
export const getVoucher = async (req, res) => {
    try {
        const data = await Voucher.findById(req.params.id)
        if (!data) {
            return res.status(404).json({
                status: 404,
                message: "Voucher not found!",
            });
        }
        return res.status(201).json({
            status: 201,
            message: "success",
            body: { data }
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}
export const getAllVoucher = async (req, res) => {
    try {
        const data = await Voucher.findById()
        return res.status(201).json({
            status: 201,
            message: "success",
            body: { data }
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}
export const removeVoucher = async (req, res) => {
    try {
        const data = await Voucher.findByIdAndDelete(req.params.id)
        return res.status(201).json({
            status: 201,
            message: "Voucher deleted",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}
export const updateVoucher = async (req, res) => {
    try {
        const { quantity, date_end, status } = req.body
        const data = await Voucher.findByIdAndUpdate(req.params.id, {
            quantity, date_end, status
        })
        if (!data) {
            return res.status(404).json({
                status: 404,
                message: "Voucher update failed!",
            });
        }
        return res.status(201).json({
            status: 201,
            message: "Voucher update success",
            body: { data }
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

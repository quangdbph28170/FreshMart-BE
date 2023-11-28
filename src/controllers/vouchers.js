import Joi from "joi";
import Voucher from "../models/vouchers"
import User from "../models/user"
import voucherValid from "../validation/vouchers";

const voucherSchema = Joi.object({
    code: Joi.string().required(),
    miniMumOrder: Joi.number().required(),
    userId: Joi.string().required(),
})

export const validateVoucher = async (req, res) => {
    try {
        const { error } = voucherSchema.validate(req.body, { abortEarly: false })

        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }
        const { code, miniMumOrder, userId } = req.body
        const voucherExist = await Voucher.findOne({ code })

        const user = await User.findById(userId)

        //Id user 
        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found!",
            });
        }
        //Mã ko hợp lệ
        if (!voucherExist) {
            return res.status(404).json({
                status: 404,
                message: "Voucher does not exist!",
            });
        }
        //Hết số lượng
        if (voucherExist.quantity == 0) {
            return res.status(400).json({
                status: 400,
                message: "Voucher is out of quantity!",
            });
        }
        //Voucher ko còn hoạt động
        if (voucherExist.status == false) {
            return res.status(400).json({
                status: 400,
                message: "Voucher does not work!",
            });
        }

        //Voucher đã hết hạn
        const dateNow = new Date()
        if (voucherExist.dateEnd < dateNow) {
            return res.status(400).json({
                status: 400,
                message: "Voucher is out of date",
            });
        }

        //Chưa đạt yc với tối thiểu đơn hàng
        if (voucherExist.miniMumOrder > miniMumOrder) {
            return res.status(400).json({
                status: 400,
                message: "Orders are not satisfactory!",
                miniMumOrder: voucherExist.miniMumOrder
            });
        }
        // user Đã dùng rồi
        const userExist = await Voucher.findOne({ code: req.body.code, "users.userId": req.body.userId })
        if (userExist) {
            return res.status(400).json({
                status: 400,
                message: "This voucher code has already been used. Please enter a different code!",

            });
        }
        // Hợp lệ
        return res.status(200).json({
            status: 200,
            message: "Valid",
            body: { data: voucherExist }
        });

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
        const voucherExist = await Voucher.findOne({ code: req.body.code })
        if (voucherExist) {
            return res.status(400).json({
                status: 400,
                message: "This code has existed!"
            })
        }
        if (new Date(req.body.dateStart) > new Date(req.body.dateEnd)) {
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
        const data = await Voucher.find()
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

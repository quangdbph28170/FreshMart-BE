import mongoose from "mongoose";
import Origin from "../models/origin";
import Products from "../models/products";
import { originSchema } from "../validation/origin";

export const createOrigin = async (req, res) => {
    try {
        const { error } = originSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }

        const nameExist = await Origin.findOne({ name: req.body.name })
        if(nameExist) {
            return res.status(400).json({
                status: 400,
                message: "Tên đã tồn tại",
            });
        }

        const origin = await Origin.create(req.body)

        if (!origin) {
            return res.status(401).json({
                status: 400,
                message: "Create origin failed",
            });
        }

        return res.status(200).json({
            body: {
                data: origin
            },
            status: 200,
            message: "Create origin successed",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

export const findAll = async (req, res) => {
    const {
        _page = 1,
        _order = "asc",
        _limit = 9999,
        _sort = "createdAt",
        _q = "",
    } = req.query;
    const options = {
        page: _page,
        limit: _limit,
        sort: {
            [_sort]: _order === "desc" ? -1 : 1,
        },
    };
    const query = {};

    if (_q) {
        query.name = { $regex: _q, $options: "i" };
    }

    try {
        const origin = await Origin.paginate(query, options)

        if (!origin) {
            return res.status(401).json({
                status: 400,
                message: "No Origins found",
            });
        }

        return res.status(200).json({
            body: {
                data: origin.docs
            },
            status: 200,
            message: "Origin found",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

export const findOne = async (req, res) => {
    try {
        const { id } = req.params

        const origin = await Origin.findById(id)

        if (!origin) {
            return res.status(401).json({
                status: 400,
                message: "No origin found",
            });
        }

        return res.status(200).json({
            body: {
                data: origin
            },
            status: 200,
            message: "Origin found",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

export const updateOrigin = async (req, res) => {
    try {
        const { id } = req.params
        const { error } = originSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }

        const nameExist = await Origin.findOne({ name: req.body.name })
        if(!nameExist._id.equals(new mongoose.Types.ObjectId(id)) && nameExist) {
            return res.status(400).json({
                status: 400,
                message: "Tên đã tồn tại",
            });
        }

        const origin = await Origin.findByIdAndUpdate(id, req.body, { new: true })

        if (!origin) {
            return res.status(401).json({
                status: 400,
                message: "Update origin failed",
            });
        }

        return res.status(200).json({
            body: {
                data: origin
            },
            status: 200,
            message: "Update origin successed",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

export const removeOrigin = async (req, res) => {
    try {
        const { id } = req.params
        let defaultOrigin = await Origin.findOne({ type: 'default' })

        if(!defaultOrigin) {
            defaultOrigin = await Origin.create({
                name: 'Chưa cập nhật thông tin xuất xứ',
                type: 'default'
            })
        }
        const products = await Products.find({ originId: id })

        for(const product of products) {
            await Products.findByIdAndUpdate(product._id, {
                originId: defaultOrigin._id,
            })
        }

        await Origin.findByIdAndDelete(id)

        return res.status(200).json({
            status: 200,
            message: "Origin deleted successfully",
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}
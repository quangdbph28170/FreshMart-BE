import Evaluation from "../models/evaluation"
import Product from "../models/products"
import Order from "../models/orders"
import { validateEvaluation } from "../validation/evaluation"
import Joi from "joi"
import User from "../models/user"
import { doneOrder } from "../config/constants"
const formatPhoneNumber = /^0+[0-9]{9}$/;
const validRate = Joi.object({
    userName: Joi.string().required(),
    phoneNumber: Joi.string().pattern(formatPhoneNumber).trim().messages({
        "string.pattern.base": "Please enter a valid phone number!",
        "string.empty": "Phone number is not empty!",
    }).required(),
})
export const createEvaluation = async (req, res) => {
    try {
        const { orderId, productId } = req.body
        const { error } = validateEvaluation.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(401).json({
                status: 401,
                message: error.details.map((error) => error.message),
            });
        }

        const { userName, phoneNumber } = req.body
        if (!req.body.userId) {
            const { error } = validRate.validate({ userName, phoneNumber }, { abortEarly: false })
            if (error) {
                return res.status(402).json({
                    status: 402,
                    message: error.details.map((error) => error.message),
                });
            }
        }

        const orderExist = await Order.findById(orderId)
        if (!orderExist) {
            return res.status(404).json({
                status: 404,
                message: "Order not found",
            });
        }
        if (orderExist.status != doneOrder) {
            return res.status(404).json({
                status: 404,
                message: "Order status Invalid!",
            });
        }
        const productExist = await Order.findOne({ _id: orderId, "products.productId": productId })
        if (!productExist) {
            return res.status(404).json({
                status: 404,
                message: "Product not found in order!",
            });
        }
        // Check xem sp này trong đơn hàng đấy đã được đánh giá chưa 
        const isRated = orderExist.products.find(item => item.productId == productId)

        if (isRated.evaluation) {
            return res.status(400).json({
                status: 400,
                message: "Sản phẩm này đã được đánh giá trong đơn hàng !",
            })
        }
        const data = await Evaluation.create(req.body)
        //Update lại sp đã được đánh gái trong đơn hàng evaluation => true
        await Order.findOneAndUpdate({ _id: orderId, "products.productId": productId }, {
            $set: {
                "products.$.evaluation": true
            }
        }, { new: true })

        //push id evaluated vao Products
        await Product.findByIdAndUpdate(productId, {
            $push: {
                evaluated: {
                    evaluatedId: data._id
                }
            }
        })
        return res.status(200).json({
            status: 200,
            message: "Created rating",
            body: { data }
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

// lấy danh sách đánh giá theo sản phẩm
export const getIsRatedByProductId = async (req, res) => {
    const {
        _page = 1,
        _order = "asc",
        _limit = 9999,
        _sort = "createdAt",
    } = req.query;
    const options = {
        page: _page,
        limit: _limit,
        sort: {
            [_sort]: _order === "desc" ? -1 : 1,
        },
        populate: ['userId']
    };
    try {
        const query = { productId: req.params.id }
        const data = await Evaluation.paginate(query, options)
        if (!data) {
            return res.status(404).json({
                status: 404,
                message: "Failed to find product",
            })
        }
        return res.status(200).json({
            status: 200,
            message: "success",
            body: {
                data: data.docs,
                pagination: {
                    currentPage: data.page,
                    totalPages: data.totalPages,
                    totalItems: data.totalDocs,
                },
            }
        })
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
}

// chi tiết đánh giá
export const getIsRatedDetail = async (req, res) => {
    try {
        const data = await Evaluation.findById(req.params.id).populate("productId")
        if (!data) {
            return res.status(404).json({
                status: 404,
                message: "Failed",
            })
        }
        if (data.userId != null) {
            await data.populate("userId")
        }
        return res.status(200).json({
            status: 200,
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
//Admin Lấy toàn bộ đánh giá
export const getAllRating = async (req, res) => {
    try {
        const data = await Evaluation.find().populate("userId").populate("productId")
        // const highestRatedProduct = await Evaluation.aggregate([
        //     { $group: { _id: "$productId", averageRating: { $avg: "$rate" } } },
        //     { $sort: { averageRating: -1 } },
        //     { $limit: 1 },
        //     { $project: { _id: 0, productId: "$_id" } }
        // ]);

        // const lowestRatedProduct = await Evaluation.aggregate([
        //     { $group: { _id: "$productId", averageRating: { $avg: "$rate" } } },
        //     { $sort: { averageRating: 1 } },
        //     { $limit: 1 },
        //     { $project: { _id: 0, productId: "$_id" } }
        // // ]);
        // console.log(highestRatedProduct);
        // console.log(lowestRatedProduct);
        return res.status(200).json({
            status: 200,
            message: "success",
            body: {
                data,
                // highestRatedProductId: highestRatedProduct[0].productId,
                // lowestRatedProductId: lowestRatedProduct[0].productId
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message,
        });
    }
};
//Admin ẩn đánh giá
export const isReviewVisible = async (req, res) => {
    try {
        const data = await Evaluation.findByIdAndUpdate(req.params.id, {
            isReviewVisible: false
        }, { new: true })
        if (!data) {
            return res.status(404).json({
                status: 404,
                message: "Failed",
            })
        }
        return res.status(200).json({
            status: 200,
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
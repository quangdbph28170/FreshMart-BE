import mongoose from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2"
const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    products: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Products",
                required: true
            },
            name: {
                type: String,
                required: true
            },
           
            weight: {
                type: Number,
                required: true
            },
           
            price: {
                type: Number,
                required: true
            },
        }
    ],
    totalPayment: {
        type: Number,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    note: {
        type: String,
        default: null
    },
    shippingAddress: {
        type: String,
        required: true
    },
    receivedDate: {
        type: String,
        default: null
    },
    pay: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["chờ xác nhận", "đang giao hàng", "đã hoàn thành", "đã hủy"],
        default: "chờ xác nhận"
    }

}, { versionKey: false, timestamps: true })
orderSchema.plugin(mongoosePaginate)
export default mongoose.model('Orders', orderSchema)
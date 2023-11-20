import mongoose from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2"
import shortMongoId from "short-mongo-id";
const orderSchema = new mongoose.Schema({
    invoiceId:{
        type:String,
        default:function(){
            return shortMongoId(this._id)
        }
    },
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
            images: {
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
        enum: ["chờ xác nhận", "đang giao hàng", "giao hàng thành công", "đã nhận được hàng","đã hủy đơn hàng"],
        default: "chờ xác nhận"
    },
    // orderDate:{
    //     type:String,
    //     default:function(){
    //         const currentDate = new Date();
    //         const formattedDate = `${("0" + currentDate.getDate()).slice(-2)}-${("0" + (currentDate.getMonth() + 1)).slice(-2)}-${currentDate.getFullYear()}`
    //         return formattedDate;
    //     }
    // }

}, { versionKey: false, timestamps: true })
orderSchema.plugin(mongoosePaginate)
export default mongoose.model('Orders', orderSchema)
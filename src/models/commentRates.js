import mongoose from "mongoose";

const commentRateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User"
    },
    productId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Products"
    },
    content: {
        type: String,
        default:null
    },
    images: {
        type: String,
        default:null
    },
    star:{
        type:Number,
        required: true
    },
    orderId:{
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Order"
    }

}, { timestamps: true, versionKey: false });

export default mongoose.model("CommentRate", commentRateSchema)
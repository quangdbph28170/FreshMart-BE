import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema({
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
        default: null
    },
    imgUrl: {
        type: String,
        default: null
    },
    star: {
        type: Number,
        required: true
    },
    orderId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Order"
    },
    isReviewVisible: {
        type: Boolean,
        default: true
    }

    // date: => createdAt

}, { timestamps: true, versionKey: false });

export default mongoose.model("Evaluation", evaluationSchema)
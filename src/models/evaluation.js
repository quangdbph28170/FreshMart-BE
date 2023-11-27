import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        default: null,
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
    userName: {
        type: String,
        default: null
    },
    phoneNumber: {
        type: String,
        default: null
    },
    rate: {
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
import mongoose from "mongoose"

const cartSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Products",
                required: true
            },
            weight: {
                type: Number,
                required: true
            },
        }
    ]

}, { versionKey: false, timestamps: true })
export default mongoose.model('Cart', cartSchema)
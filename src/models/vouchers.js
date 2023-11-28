import mongoose from 'mongoose';
import mongoPaginate from "mongoose-paginate-v2"
const voucherSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        miniMumOrder: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        dateStart: {
            type: Date,
            required: true,
        },
        dateEnd: {
            type: Date,
            required: true,
        },
        status: {
            type: Boolean,
            default: true
        },
        maxReduce: {
            type: Number,
            default: 0,
        },
        percent: {
            type: Number,
            required: true,
        },
        users: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            }
        ]
    },
    { timestamps: true, versionKey: false },
);
voucherSchema.plugin(mongoPaginate)
export default mongoose.model('Voucher', voucherSchema);
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
        discount: {
            type: Number,
            required: true,
        },
        condition: {
            type: Number,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        date_start: {
            type: Date,
            required: true,
        },
        date_end: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["đang hoạt động", "đã sử dụng", "hết hạn"]
        },
    },
    { timestamps: true, versionKey: false },
);
voucherSchema.plugin(mongoPaginate)
export default mongoose.model('Voucher', voucherSchema);
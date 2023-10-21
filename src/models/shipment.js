import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const shipmentSchema = new mongoose.Schema(
  {
    products: {
      type: [
        {
          idProduct: {
            type: mongoose.Types.ObjectId,
            ref: "Products",
            required: true,
          },
          date: {
            type: String,
            required: true,
          },
          weight: {
            type: Number,
            required: true,
          },
          origin: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },
    totalMoney: {
      type: Number,
      required: true,
    },
    isDisable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
shipmentSchema.plugin(mongoosePaginate);
shipmentSchema.index({ name: "text" });
export default mongoose.model("Shipment", shipmentSchema);

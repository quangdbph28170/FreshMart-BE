import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const unsoldProductSchema = new mongoose.Schema(
  {
    originalID: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    shipments: [
      {
        shipmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Shipment",
          required: true,
        },
        purchasePrice: {
          type: Number,
          required: true,
        },
        weight: {
          type: Number,
          required: true,
        }
      }
    ],

  },
  { timestamps: true, versionKey: false }
);
unsoldProductSchema.plugin(mongoosePaginate);
unsoldProductSchema.index({ name: "text" });
export default mongoose.model("UnSoldProduct", unsoldProductSchema);

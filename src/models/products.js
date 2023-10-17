import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    price: {
      type: String,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
    desc: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    sold: {
      type: Number,
      default: 0,
    },
    shipments: {
      type: [
        {
          idShipment: {
            type: mongoose.Types.ObjectId,
            ref: "Shipment",
            required: true,
          },
          quantity: Number,
          date: String,
          price: Number,
        },
      ],
      default: [],
    },
    comments: {
      type: [
        {
          type: mongoose.Types.ObjectId,
          // ref:"Comment",
        },
      ],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);
productSchema.plugin(mongoosePaginate);
productSchema.index({ name: "text" });
export default mongoose.model("Products", productSchema);

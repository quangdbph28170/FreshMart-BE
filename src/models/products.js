import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
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
        _id: false
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
    price: {
      type: Number,
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
          },
          originWeight: Number,
          weight: Number,
          date: String,        
          originPrice: Number,
        },
      ],
      default: [],
    },
    originId: {
      type: mongoose.Types.ObjectId,
      ref: "Origin",
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
    isSale:{
      type:Boolean,
      default: false,
    }

  },
  { timestamps: true, versionKey: false }
);
productSchema.plugin(mongoosePaginate);
productSchema.index({ name: "text" });
export default mongoose.model("Products", productSchema);

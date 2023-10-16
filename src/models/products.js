import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    price:{
        type:String,
        required:true,
    },
    imgUrl:{
        type:String,
        required:true
    },
    desc:{
        type:String,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    categoryId:{
        type:mongoose.Types.ObjectId,
        ref:"Category",
        required:true
    },
    sold:{
        type:Number,
        default:0
    },
    // shipmentId:{
    //     type:mongoose.Types.ObjectId,
    //     ref:"Shipment",
    //     required:true
    // },
    // commentId:{
    //     type:mongoose.Types.ObjectId,
    //     ref:"Comment",

    // }

},{timestamps:true, versionKey:false})
productSchema.plugin(mongoosePaginate)
productSchema.index({ name: 'text' })
export default mongoose.model("Products", productSchema)
// import mongoose from "mongoose";
// import mongoosePaginate from "mongoose-paginate-v2";
// const shipmentSchema = new mongoose.Schema({
//     shipmentName: {
//         type: String,
//         required: true
//     },
//     products: [
//         {
//             productId: {
//                 type: mongoose.Types.ObjectId,
//                 ref:"Products",
//                 required: true,
//             },
//             date: {
//                 type: Date,
//                 required: true
//             },
//             weight: {
//                 type: String,
//                 required: true
//             },
//             origin: {
//                 type: String,
//                 required: true
//             },
//             stock:{
//                 type: Number,
//                 required: true
//             }

//         }
//     ],
//     totalMoney: {
//         type: Number,
//         required: true
//     },
//     isDisable:{
//         type: Boolean,
//         default: false
//     }
// })
// shipmentSchema.plugin(mongoosePaginate)
// shipmentSchema.index({ name: 'text' })
// export default mongoose.model("Shipment", shipmentSchema)
import mongoose from 'mongoose';
import mongoosePaginate from "mongoose-paginate-v2";
const originSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
      },
      type: {
         type: String,
         enum: ['default', 'normal'],
         default: 'normal'
      }
   },
   { timestamps: true, versionKey: false },
);
originSchema.plugin(mongoosePaginate);
originSchema.index({ name: "text" });
export default mongoose.model('Origin', originSchema);
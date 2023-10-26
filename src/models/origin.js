import mongoose from 'mongoose';

const originSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
      },
   },
   { timestamps: true, versionKey: false },
);

export default mongoose.model('Origin', originSchema);
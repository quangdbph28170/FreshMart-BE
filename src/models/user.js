import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';

const userSchema = new mongoose.Schema(
   {
      userName: {
         type: String,
         required: true,
      },
      email: {
         type: String,
         required: true,
      },
      password: {
         type: String,
         required: true,
      },
      phoneNumber: {
         type: String,
         default: null,
      },
      address: {
         type: String,
         default: null,
      },
      avatar: {
         type: String,
         default:
            'https://lh5.googleusercontent.com/x14nnYSvR1c8KkO6Kj1giR4iZcQL0UelyqcGBRFt8fHQg8sRUouMkFc3b_F-kmDLDW-qpDo8KkBpuXGnfUNjy6NZVqwAcBYnngbupNd2scJqGyNpjYTGQZdfY3ktqFJZNsKfXR-YrDmqrcQwOrM4k2M',
      },
      role: {
         type: String,
         enum: ['admin', 'member'],
         default: 'member',
      },
      cartId: {
         type: mongoose.Types.ObjectId,
         ref:"Cart",
         default: null
      },
      orders:[
         {
            type: mongoose.Types.ObjectId,
            ref:"Order",
            default: null
         }
      ] ,
      notifications: [String],
      vouchers: [String],
      state: {
         type: Boolean,
         default: true,
      },
   },
   { timestamps: true, versionKey: false },
);

userSchema.plugin(paginate)

export default mongoose.model('User', userSchema);

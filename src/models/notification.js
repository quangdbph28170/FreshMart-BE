import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
   {
      title: {
         type: String,
         required: true,
      },
      message: {
         type: String,
         required: true,
      },
      link: {
         type: String,
         default: null,
      },
      userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      type: {
        type: String,
        enum: ['client', 'admin'],
        default: 'client',
        required: true,
      },
      isRead: {
        type: Boolean,
        default: false,
      }
   },
   { timestamps: true, versionKey: false },
);

export default mongoose.model('Notification', notificationSchema);
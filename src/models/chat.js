import mongoose from "mongoose"

const chatSchema = new mongoose.Schema({

    roomChatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    messages:[{
        isRead:{
            type: Boolean,
            default: false,
        },
        content:{
            type:String,
            required: true,
        },
        sender:{
            type: String,
            enum: ['client', 'admin'],
            required: true,
        },
        day:{
            type: Date,
            default: new Date(),
        }
    }],
    link: {
        type: String,
        default: null,
     },
}, { versionKey: false, timestamps: true })
export default mongoose.model('Chat', chatSchema)
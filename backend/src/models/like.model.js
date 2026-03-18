import { model, Schema } from "mongoose";

const likeSchema = new Schema({
    likableId: {
        type: Schema.Types.ObjectId,
        refPath: 'likableType',
        required: true,
    },
    likableType: {
        type: String,
        enum: ['Post', 'Comment'],
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

likeSchema.index({ user: 1, createdAt: -1 });
likeSchema.index({ user: 1, likableType: 1, createdAt: -1});
likeSchema.index({ likableId: 1, likableType: 1 });
likeSchema.index({ likableId: 1 });
likeSchema.index({ user: 1, likableId: 1, likableType: 1 }, { unique: true });

const Like = model('Like', likeSchema);

export default Like;
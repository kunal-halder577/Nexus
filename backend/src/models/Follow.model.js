import { model, Schema } from "mongoose";

const followSchema = new Schema({
    followerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followingId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted'],
        default: 'accepted',
    },
    isMuted: {
        type: Boolean,
        default: false
    },
    isCloseFriend: {
        type: Boolean,
        default: false
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

followSchema.pre('save', function () {
    if (this.followerId.equals(this.followingId)) {
        throw new Error('User cannot follow themselves');
    }
});

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followerId: 1 });
followSchema.index({ followingId: 1 });

const Follow = model('Follow', followSchema);

export default Follow;
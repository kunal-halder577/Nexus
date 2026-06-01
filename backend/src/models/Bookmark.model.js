import { model, Schema } from "mongoose"

const bookMarkSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }
}, { timestamps: true });

bookMarkSchema.index({ owner: 1, post: 1 }, { unique: true });
bookMarkSchema.index({ owner: 1, createdAt: -1 });

const Bookmark = model('Bookmark', bookMarkSchema);

export default Bookmark;
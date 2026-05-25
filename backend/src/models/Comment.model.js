import { model, Schema } from "mongoose";

const MAX_NESTING_DEPTH = 3;

const commentSchema = new Schema(
    {
        postId: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
        depth: {
            type: Number,
            default: 0,
            min: 0,
            max: MAX_NESTING_DEPTH,
        },
        content: {
            text: {
                type: String,
                required: true,
                trim: true,
                minLength: [1, 'Comment cannot be empty.'],
                maxLength: [2200, 'Comment cannot exceed 2200 characters.'],
            }
        },
        stats: {
            likeCount: {
                type: Number,
                default: 0,
                min: 0,
            },
            replyCount: {
                type: Number,
                default: 0,
                min: 0,
            }
        },
        deletedAt: {
            type: Date,
            default: null,
        }
    }, 
    { timestamps: true }
);

// Compound indexes for optimal querying
commentSchema.index({ postId: 1, parentId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: -1 });

// Enforce nesting depth limit on reply creation
commentSchema.pre('validate', async function () {
    if (this.isNew && this.parentId) {
        const parent = await model('Comment').findById(this.parentId)
            .select('depth')
            .lean();
        
        if (!parent) {
            throw new Error('Parent comment not found.');
        }
        if (parent.depth >= MAX_NESTING_DEPTH) {
            throw new Error(`Replies cannot be nested more than ${MAX_NESTING_DEPTH} levels deep.`);
        }

        this.depth = parent.depth + 1;
    }
});

const Comment = model('Comment', commentSchema);

export default Comment;
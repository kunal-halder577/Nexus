import { model, Schema } from "mongoose";

const mediaSchema = new Schema(
    {
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String, 
            required: true
        },
        thumbnailUrl: {
            type: String
        },
        type: {
            type: String,
            enum: ['Image', 'Video', 'GIF'],
            default: 'Image',
        },
        aspectRatio: {
            type: Number,
            required: function () {
                return ['Image', 'Video', 'GIF'].includes(this.type);
            }
        },
    },
    { _id: false }
);

const postSchema = new Schema(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        content: {
            caption: {
                type: String,
                trim: true,
                maxLength: 2200
            }
        },
        media: [
            {
                type: mediaSchema,
                validate: {
                    validator: function(arr) {
                       return arr.length <= 10;
                    },
                    message: "Maximum 10 media items allowed"
                }
            }
        ],
        stats: {
            likeCount: {
                type: Number,
                default: 0,
                min: 0,
            },
            commentCount: {
                type: Number,
                default: 0,
                min: 0,
            },
            shareCount: {
                type: Number,
                default: 0,
                min: 0,
            },
            viewCount: {
                type: Number,
                default: 0,
                min: 0,
            },
        }
    }, 
    { timestamps: true }
);

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ author: 1, createdAt: -1, _id: -1 });


postSchema.pre('validate', function() {
    if (!this.content?.caption && (!this.media || this.media.length === 0)) {
        return next(new Error('Post must have either a caption or media'));
    }
    next();
});

const Post = model('Post', postSchema);

export default Post;
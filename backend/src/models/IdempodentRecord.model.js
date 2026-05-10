import { model, Schema } from "mongoose";

const IdempotentRecordSchema = new Schema({
    key: {
        type: String, 
        required: true,
        lowercase: true,
        trim: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ["PROCESSING", "SUCCESS", "FAILED_PERMANENT", "FAILED_RETRYABLE"],
        default: "PROCESSING",
    },
    response_body: {
        type: Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    }
});

IdempotentRecordSchema.index({ key: 1, user_id: 1 }, { unique: true });

const IdempotentRecord =  model('IdempodentRecord', IdempotentRecordSchema);

export default IdempotentRecord;
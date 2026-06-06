import { model, Schema } from 'mongoose';

const auditLogSchema = new Schema(
    {
        actor: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: ["ASSIGN_ROLE", "BAN_USER", "DELETE_USER", "EDIT_USER", "UNBAN_USER", "DELETE_POST", "DELETE_COMMENT", "EDIT_POST", "EDIT_COMMENT"],
            required: true,
            index: true,
        },
        target: {
            type: Schema.Types.ObjectId,
            refPath: 'targetModel',
            index: true,
            required: function() { return !!this.targetModel; }
        },
        targetModel: {
            type: String,
            enum: ['User', 'Post', 'Comment'],
            required: function() { return !!this.target; }
        },
        details: {
            type: Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        }
    },
    { timestamps: true }
);

// Indexes for common queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

const AuditLog = model('AuditLog', auditLogSchema);

export default AuditLog;

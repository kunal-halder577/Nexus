import cron from "node-cron"
import Like from "../models/like.model.js";

const cleanOrphanedLikes = async () => {
    
    console.log("🧹Starting cleanup of orphaned likes...");

    try {
        const orphanedPostLikes = await Like.aggregate([
            { $match: { likableType: 'Post' } },
            { 
                $lookup: {
                    from: 'posts',
                    localField: 'likableId',
                    foreignField: '_id',
                    as: 'parentPost'                
                }
            },
            { $match: { parentPost: { $size: 0 } } },
            { $project: { _id: 1 } }
        ]);
    
        const orphanedPostlikeIds = orphanedPostLikes.map(like => like._id);
    
        if(orphanedPostlikeIds.length > 0) {
            const result = await Like.deleteMany({ _id: { $in: orphanedPostlikeIds } });
            console.log(`Deleted ${result.deletedCount} orphaned post likes.`);
        }
    } catch (error) {
        console.error('❌ Error during orphaned likes cleanup:', error);
    }
}

export const startCronJob = () => {
    cron.schedule('0 3 * * 0', () => {
        cleanOrphanedLikes();
    });
    console.log('Cron job scheduled.');
}
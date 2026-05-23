import cron from 'node-cron';
import Post from '../models/post.model.js';
import redis from '../cache/redisConfig.js';

let isSyncing = false;

const syncViewsToDatabase = async () => {
  if (isSyncing) {
    console.warn('⚠️ Previous sync still running, skipping this tick.');
    return;
  }
  isSyncing = true;

  try {
    const tempKey = `pending_view_sync:processing:${Date.now()}`;

    const renamed = await redis.rename('pending_view_sync', tempKey).catch(() => null);
    if (!renamed) {
      console.log('✨ No pending views to sync.');
      return;  // ✅ finally still runs
    }

    const pendingPostIds = await redis.smembers(tempKey);
    if (pendingPostIds.length === 0) {
      await redis.del(tempKey);
      return;  // ✅ finally still runs
    }

    const pipeline = redis.pipeline();
    pendingPostIds.forEach(id => pipeline.pfcount(`uniques:${id}`));
    const pipelineResults = await pipeline.exec();

    if (!pipelineResults) {
      console.error('❌ Redis pipeline returned null — aborting sync.');
      return;  // ✅ finally still runs
    }

    const bulkOps = pendingPostIds.map((id, index) => {
      const [error, count] = pipelineResults[index] || [null, 0];
      if (error) console.error(`Redis error for post ${id}:`, error);
      const uniqueViews = count != null ? Number(count) : 0;
      return {
        updateOne: {
          filter: { _id: id },
          update: { $max: { 'stats.viewCount': uniqueViews } }
        }
      };
    });

    await Post.bulkWrite(bulkOps);
    console.log(`💾 Successfully synced views for ${bulkOps.length} posts.`);

    await redis.del(tempKey);

  } catch (error) {
    console.error('❌ Error during view sync:', error);
  } finally {
    isSyncing = false;  // ✅ always runs
  }
};

const startCronJobForView = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await syncViewsToDatabase()
    } catch (error) {
      console.error("Error in syncViewsToDatabase", error);
    }
  });
  console.log('✅ Cron job for view sync started.');
};

export default startCronJobForView;
import { TikTokUser, TikTokVideo, TikTokAnalytics } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { Op } from 'sequelize';

export const getProfileAnalytics = async (req, res) => {
  try {
    const { username } = req.params;
    const { period = 30 } = req.query;

    // Get TikTok user
    const tikTokUser = await TikTokUser.findOne({
      where: { username },
      include: [
        {
          model: TikTokVideo,
          as: 'videos',
          limit: 10,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: TikTokAnalytics,
              as: 'analytics',
              where: {
                recorded_at: {
                  [Op.gte]: new Date(Date.now() - period * 24 * 60 * 60 * 1000)
                }
              },
              order: [['recorded_at', 'DESC']],
              limit: 1
            }
          ]
        }
      ]
    });

    if (!tikTokUser) {
      return sendError(res, 'Profile not found', 404);
    }

    // Get follower growth data
    const followerGrowth = await TikTokAnalytics.findAll({
      include: [
        {
          model: TikTokVideo,
          as: 'video',
          where: { ticktok_user_id: tikTokUser.user_id },
          attributes: []
        }
      ],
      attributes: [
        [sequelize.fn('DATE', sequelize.col('recorded_at')), 'date'],
        [sequelize.fn('AVG', sequelize.col('view_count')), 'avg_views'],
        [sequelize.fn('AVG', sequelize.col('like_count')), 'avg_likes'],
        [sequelize.fn('COUNT', sequelize.col('TikTokAnalytics.id')), 'data_points']
      ],
      where: {
        recorded_at: {
          [Op.gte]: new Date(Date.now() - period * 24 * 60 * 60 * 1000)
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('recorded_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('recorded_at')), 'ASC']]
    });

    sendSuccess(res, {
      profile: tikTokUser,
      followerGrowth,
      period: `${period} days`
    });

  } catch (error) {
    console.error('Analytics error:', error);
    sendError(res, 'Failed to fetch analytics');
  }
};

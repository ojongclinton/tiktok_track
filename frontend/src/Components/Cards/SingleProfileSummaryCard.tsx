import {
  FiHeart,
  FiUsers,
  FiPlay,
  FiExternalLink,
  FiMinus,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { colorSystem } from "../../utils/constants";
import type { UserTrackedProfile } from "../../types/profiles";

const TikTokUserCard = ({
  user,
  onCardClick,
}: {
  user: UserTrackedProfile;
  onCardClick: (user: UserTrackedProfile) => void;
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B";
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num?.toString() || "0";
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    const growth = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(growth).toFixed(1),
      isPositive: growth > 0,
      isNeutral: growth === 0,
    };
  };

  const GrowthIndicator = ({
    current,
    previous,
    icon: Icon,
    label,
    color,
  }: {
    current: number;
    previous: number;
    icon: any;
    label: string;
    color: string;
  }) => {
    const growth = calculateGrowth(current, previous);

    return (
      <div className="relative">
        <div
          className="flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 hover:shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${color}05 0%, ${color}10 100%)`,
            border: `1px solid ${color}15`,
          }}
        >
          <div
            className="p-2 rounded-lg"
            style={{
              background: `${color}15`,
            }}
          >
            <Icon size={14} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            <div className="flex items-center space-x-2">
              <p className="text-base font-bold text-gray-900">
                {formatNumber(current)}
              </p>
              {growth && (
                <div
                  className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                    growth.isNeutral
                      ? "bg-gray-100 text-gray-600"
                      : growth.isPositive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {growth.isNeutral ? (
                    <FiMinus size={10} />
                  ) : growth.isPositive ? (
                    <FiTrendingUp size={10} />
                  ) : (
                    <FiTrendingDown size={10} />
                  )}
                  <span>{growth.percentage}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleTikTokClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.tiktok.com/@${user.username}`, "_blank");
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(user);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer overflow-hidden group"
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)",
      }}
    >
      {/* Gradient Border Effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: colorSystem.gradient.primary,
          padding: "2px",
        }}
      >
        <div className="w-full h-full bg-white rounded-2xl"></div>
      </div>

      <div className="relative z-10 p-4">
        {/* Header with enhanced profile section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="relative">
                <img
                  src={`https://fra.cloud.appwrite.io/v1/storage/buckets/68aa397a0006a5842781/files/${user.profile_image_url}/view??project=68a613ec0030e36f4f46`}
                  alt={`${user.display_name} profile`}
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-white"
                  style={{
                    boxShadow: `0 4px 16px ${colorSystem.primary}20`,
                  }}
                  onError={(e: any) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.display_name
                    )}&background=${colorSystem.primary.slice(
                      1
                    )}&color=ffffff&size=56`;
                  }}
                />
                {/* Status indicators */}
                <div className="absolute -bottom-1 -right-1 flex space-x-1">
                  {user.private_account && (
                    <div className="bg-gray-500 rounded-full p-1 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                  {user.verified && (
                    <div className="bg-blue-500 rounded-full p-0.5 shadow-sm">
                      <RiVerifiedBadgeFill className="text-white" size={10} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                  {user.display_name}
                </h3>
                {user.verified && (
                  <div className="flex items-center space-x-1">
                    <RiVerifiedBadgeFill className="text-blue-500" size={16} />
                  </div>
                )}
              </div>
              <p className="text-gray-500 text-sm">@{user.username}</p>
              <div className="flex items-center space-x-2 mt-1">
                {/* <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                  ID: {user.user_id?.slice(-6)}
                </div> */}
                {user.private_account && (
                  <div className="px-2 py-0.5 bg-red-100 rounded text-xs font-medium text-red-600">
                    Private
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced TikTok Button */}
          <button
            onClick={handleTikTokClick}
            className="relative p-2 rounded-lg transition-all duration-300 hover:scale-105"
            style={{
              background: colorSystem.gradient.primary,
              boxShadow: `0 2px 10px ${colorSystem.primary}25`,
            }}
            title="Open TikTok Profile"
          >
            <FiExternalLink size={16} className="text-white" />
          </button>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <GrowthIndicator
            current={user.followers_count}
            previous={user.previous_followers_count}
            icon={FiUsers}
            label="Followers"
            color={colorSystem.primary}
          />

          <GrowthIndicator
            current={user.likes_count}
            previous={user.previous_likes_count}
            icon={FiHeart}
            label="Total Likes"
            color={colorSystem.accent}
          />
        </div>

        {/* Bottom Enhanced Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
            <div className="p-1.5 rounded-lg bg-purple-100">
              <FiPlay size={12} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Videos</p>
              <div className="flex items-center space-x-1">
                <p className="text-sm font-bold text-gray-900">
                  {formatNumber(user.video_count)}
                </p>
                {user.previous_video_count && (
                  <div className="flex items-center space-x-1 text-xs">
                    {(() => {
                      const growth = calculateGrowth(
                        user.video_count,
                        user.previous_video_count
                      );
                      if (!growth) return null;
                      return (
                        <div
                          className={`flex items-center ${
                            growth.isPositive
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {growth.isPositive ? (
                            <FiTrendingUp size={8} />
                          ) : (
                            <FiTrendingDown size={8} />
                          )}
                          <span className="text-xs">{growth.percentage}%</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
            <div className="p-1.5 rounded-lg bg-blue-100">
              <FiUsers size={12} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Following</p>
              <p className="text-sm font-bold text-gray-900">
                {formatNumber(user.following_count)}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Footer with Last Update */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400">
              Updated: {new Date(user.last_scraped).toLocaleDateString()}
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Active</span>
            </div>
          </div>
        </div>

        {/* Animated Hover Gradient Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <div
            className="w-full h-full animate-pulse"
            style={{ background: colorSystem.gradient.primary }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TikTokUserCard;

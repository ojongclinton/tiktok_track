import {
  FiExternalLink,
  FiUsers,
  FiHeart,
  FiPlay,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
} from "react-icons/fi";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { colorSystem } from "../../utils/constants";
import type { UserTrackedProfile } from "../../types/profiles";

const TikTokUserList = ({
  user,
  onCardClick,
}: {
  user: UserTrackedProfile;
  onCardClick: (v: UserTrackedProfile) => void;
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

  const GrowthBadge = ({
    current,
    previous,
    className = "",
  }: {
    current: number;
    previous: number;
    className: string;
  }) => {
    const growth = calculateGrowth(current, previous);
    if (!growth) return null;

    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div
          className={`flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
            growth.isNeutral
              ? "bg-gray-100 text-gray-600"
              : growth.isPositive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {growth.isNeutral ? (
            <FiMinus size={8} />
          ) : growth.isPositive ? (
            <FiTrendingUp size={8} />
          ) : (
            <FiTrendingDown size={8} />
          )}
          <span>{growth.percentage}%</span>
        </div>
      </div>
    );
  };

  const handleTikTokClick = (e:MouseEvent) => {
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
      className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 cursor-pointer group mb-2"
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)",
      }}
    >
      {/* Gradient Border Effect */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: colorSystem.gradient.primary,
          padding: "1px",
        }}
      >
        <div className="w-full h-full bg-white rounded-lg"></div>
      </div>

      <div className="relative z-10 p-4">
        <div className="flex items-center space-x-5">
          {/* Profile Section - Fixed Width */}
          <div className="flex items-center space-x-4 w-64 flex-shrink-0">
            <div className="relative flex-shrink-0">
              <img
                src={`https://fra.cloud.appwrite.io/v1/storage/buckets/68aa397a0006a5842781/files/${user.profile_image_url}/view??project=68a613ec0030e36f4f46`}
                alt={`${user.display_name} profile`}
                className="w-14 h-14 rounded-lg object-cover ring-2 ring-white"
                style={{
                  boxShadow: `0 3px 12px ${colorSystem.primary}20`,
                }}
                onError={(e) => {
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
                  <div className="bg-gray-500 rounded-full p-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
                {user.verified && (
                  <div className="bg-blue-500 rounded-full p-1">
                    <RiVerifiedBadgeFill className="text-white" size={10} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                  {user.display_name}
                </h3>
                {user.verified && (
                  <RiVerifiedBadgeFill
                    className="text-blue-500 flex-shrink-0"
                    size={16}
                  />
                )}
                {user.private_account && (
                  <div className="px-2 py-0.5 bg-red-100 rounded text-xs font-medium text-red-600 flex-shrink-0">
                    Private
                  </div>
                )}
              </div>
              <p className="text-gray-500 text-sm truncate">@{user.username}</p>
            </div>
          </div>

          {/* Stats Section - Flexible Width */}
          <div className="flex items-center justify-between flex-1">
            {/* Stats Section - Flexible Width */}
            <div className="flex items-center justify-between flex-1">
              {/* Followers */}
              <div className="text-center flex-1">
                <div className="flex items-center justify-center space-x-1">
                  <FiUsers size={12} className="text-purple-600" />
                  <p className="text-sm font-bold text-gray-900">
                    {formatNumber(user.followers_count)}
                  </p>
                  <GrowthBadge
                    current={user.followers_count}
                    previous={user.previous_followers_count}
                  />
                </div>
                <p className="text-xs text-gray-500">Followers</p>
              </div>

              {/* Likes */}
              <div className="text-center flex-1">
                <div className="flex items-center justify-center space-x-1">
                  <FiHeart size={12} className="text-red-500" />
                  <p className="text-sm font-bold text-gray-900">
                    {formatNumber(user.likes_count)}
                  </p>
                  <GrowthBadge
                    current={user.likes_count}
                    previous={user.previous_likes_count}
                  />
                </div>
                <p className="text-xs text-gray-500">Likes</p>
              </div>

              {/* Videos */}
              <div className="text-center flex-1">
                <div className="flex items-center justify-center space-x-1">
                  <FiPlay size={12} className="text-purple-600" />
                  <p className="text-sm font-bold text-gray-900">
                    {formatNumber(user.video_count)}
                  </p>
                  <GrowthBadge
                    current={user.video_count}
                    previous={user.previous_video_count}
                  />
                </div>
                <p className="text-xs text-gray-500">Videos</p>
              </div>

              {/* Following */}
              <div className="text-center flex-1">
                <div className="flex items-center justify-center space-x-1">
                  <FiUsers size={12} className="text-blue-600" />
                  <p className="text-sm font-bold text-gray-900">
                    {formatNumber(user.following_count)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">Following</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="text-xs text-gray-400">
                {new Date(user.last_scraped).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>

              <button
                onClick={handleTikTokClick}
                className="p-1.5 rounded-lg transition-all duration-300 hover:scale-105"
                style={{
                  background: colorSystem.gradient.primary,
                  boxShadow: `0 2px 8px ${colorSystem.primary}20`,
                }}
                title="Open TikTok Profile"
              >
                <FiExternalLink size={12} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Animated Hover Gradient Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div
            className="w-full h-full"
            style={{ background: colorSystem.gradient.primary }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TikTokUserList;

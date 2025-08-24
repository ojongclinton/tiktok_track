import { useEffect, useState } from "react";
import {
  FaPlus,
  FaTiktok,
  FaChartLine,
  FaSearch,
  FaSpinner,
  FaUsers,
  FaHeart,
  FaVideo,
  FaEye,
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import {
  useAddUserTrackedProfile,
  useTestTiktokProfile,
} from "../../api/ProfilesApi";
import { colorSystem } from "../../utils/constants";
import type { SearchedTikTokProfileType } from "../../types/profiles";

// const colorSystem = {
//   primary: "#884AA0",
//   secondary: "#BB588B",
//   accent: "#DD6D6C",
//   warning: "#F9C478",
//   success: "#FBE0A1",
//   background: "#FFFFFF",
//   surface: "#F8F9FA",
//   border: "#E5E7EB",
// };

export default function TikTokAddCard({
  setOpenAddModal,
}: {
  setOpenAddModal: (open: boolean) => void;
}) {
  return (
    <div
      onClick={() => setOpenAddModal(true)}
      className="w-full aspect-[3.375/2.125] rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white border overflow-hidden group"
      style={{ borderColor: colorSystem.border }}
    >
      <div
        className="h-12 relative"
        style={{
          background: `linear-gradient(135deg, ${colorSystem.primary} 0%, ${colorSystem.secondary} 50%, ${colorSystem.accent} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative flex items-center justify-between h-full px-4">
          <div className="flex items-center space-x-2">
            <FaTiktok className="text-white text-sm" />
            <span className="text-white font-medium text-xs">
              Track Profile
            </span>
          </div>
          <FaPlus className="text-white text-xs opacity-75 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-center items-center">
        <div className="flex items-center justify-center mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: colorSystem.surface,
              border: `2px dashed ${colorSystem.border}`,
            }}
          >
            <FaPlus
              className="text-lg"
              style={{ color: colorSystem.primary }}
            />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3
            className="text-sm font-semibold"
            style={{ color: colorSystem.primary }}
          >
            Add Your First TikTok Profile
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Track stats and analytics for a new profile
          </p>
        </div>

        {/* Stats Icons */}
        <div className="mt-3 flex items-center space-x-3 opacity-60">
          <FaChartLine
            className="text-xs"
            style={{ color: colorSystem.secondary }}
          />
          <div
            className="w-1 h-1 rounded-full"
            style={{ backgroundColor: colorSystem.border }}
          ></div>
          <FaTiktok className="text-xs" style={{ color: colorSystem.accent }} />
        </div>
      </div>
    </div>
  );
}

export const TikTokProfileModal = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const [modalState, setModalState] = useState("input"); // 'input', 'loading', 'success', 'error'
  const [username, setUsername] = useState("");
  const [profileData, setProfileData] =
    useState<SearchedTikTokProfileType | null>(null);
  const [error, setError] = useState("");
  const { testTiktokProfile } = useTestTiktokProfile();
  const { addUserTrackedProfile, isLoading } = useAddUserTrackedProfile();

  const handleSearch = async () => {
    if (!username.trim()) return;

    setModalState("loading");
    try {
      const response = await testTiktokProfile(username.trim());

      if (response.statsV2 && response.shareMeta) {
        setProfileData(response);
        setModalState("success");
      } else {
        setError("Profile not found");
        setModalState("error");
      }
    } catch (err) {
      setError(
        "Failed to fetch profile. Make sure you entered the correct username "
      );
      setModalState("error");
    }
  };

  const handleTrackProfile = async () => {
    if (!profileData) return;

    const newTrackedProfile = {
      user_id: profileData.userMeta.id,
      username: profileData.userMeta.uniqueId,
      display_name: profileData.userMeta.displayName,
      followers_count: profileData.statsV2.followerCount,
      following_count: profileData.statsV2.followingCount,
      likes_count: profileData.statsV2.heartCount,
      video_count: profileData.statsV2.videoCount,
      profile_image_url: profileData.avatars.avatarMedium,
      sec_uid: profileData.userMeta.secUid,
      created_date: profileData.userMeta.createTime,
      verified: profileData.userMeta.verified,
      private_account: false,
    };

    try {
      await addUserTrackedProfile({
        tiktokProfileToTrack: newTrackedProfile,
      }).then((res) => {
        if (res) {
          console.log(res);
          resetModal();
          setIsOpen(false);
        }
      });
    } catch (error) {
      console.error("Error adding tracked profile:", error);
    }
  };

  const resetModal = () => {
    setModalState("input");
    setUsername("");
    setProfileData(null);
    setError("");
  };

  const formatNumber = (num:number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const renderContent = () => {
    switch (modalState) {
      case "input":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: colorSystem.surface }}
              >
                <FaTiktok
                  className="text-2xl"
                  style={{ color: colorSystem.primary }}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Add TikTok Profile
              </h3>
              <p className="text-sm text-gray-600">
                Enter the TikTok username to track their analytics
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Try "espn" or "test" for demo
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">@</span>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pl-8 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-opacity-50 focus:outline-none transition-all"
                    style={{
                      borderColor: colorSystem.border,
                      "--tw-ring-color": colorSystem.primary + "50",
                    }}
                    placeholder="username"
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={!username.trim()}
                className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:opacity-90"
                style={{ backgroundColor: colorSystem.primary }}
              >
                <FaSearch />
                <span>Find Profile</span>
              </button>
            </div>
          </div>
        );

      case "loading":
        return (
          <div className="text-center space-y-6 py-8">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: colorSystem.surface }}
            >
              <FaSpinner
                className="text-2xl animate-spin"
                style={{ color: colorSystem.primary }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Searching for @{username}
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we fetch the profile data...
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="space-y-4">
            {/* Compact Profile Header */}
            <div className="text-center py-3">
              <div className="relative inline-block">
                <img
                  src={profileData?.avatars?.avatarMedium}
                  alt="Profile"
                  className="w-16 h-16 rounded-full mx-auto shadow-lg ring-2 ring-white"
                  style={{
                    boxShadow: `0 4px 20px ${colorSystem.primary}30`,
                  }}
                />
                {/* Success badge */}
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: colorSystem.success }}
                >
                  <FaCheck
                    className="text-xs"
                    style={{ color: colorSystem.primary }}
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mt-3 mb-1">
                Profile Found!
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed px-2 line-clamp-2">
                {profileData?.shareMeta?.desc}
              </p>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Followers Card */}
              <div
                className="p-3 rounded-lg border transition-all duration-200 hover:shadow-sm group"
                style={{
                  backgroundColor: `${colorSystem.primary}08`,
                  borderColor: `${colorSystem.primary}20`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatNumber(
                        parseInt(profileData?.statsV2?.followerCount as any || 0)
                      )}
                    </div>
                    <div className="text-xs text-gray-600">Followers</div>
                  </div>
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${colorSystem.primary}20` }}
                  >
                    <FaUsers
                      className="text-xs"
                      style={{ color: colorSystem.primary }}
                    />
                  </div>
                </div>
              </div>

              {/* Likes Card */}
              <div
                className="p-3 rounded-lg border transition-all duration-200 hover:shadow-sm group"
                style={{
                  backgroundColor: `${colorSystem.accent}08`,
                  borderColor: `${colorSystem.accent}20`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatNumber(
                        parseInt(profileData?.statsV2?.heartCount as any || 0)
                      )}
                    </div>
                    <div className="text-xs text-gray-600">Likes</div>
                  </div>
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${colorSystem.accent}20` }}
                  >
                    <FaHeart
                      className="text-xs"
                      style={{ color: colorSystem.accent }}
                    />
                  </div>
                </div>
              </div>

              {/* Videos Card */}
              <div
                className="p-3 rounded-lg border transition-all duration-200 hover:shadow-sm group"
                style={{
                  backgroundColor: `${colorSystem.secondary}08`,
                  borderColor: `${colorSystem.secondary}20`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatNumber(
                        parseInt(profileData?.statsV2?.videoCount as any || 0)
                      )}
                    </div>
                    <div className="text-xs text-gray-600">Videos</div>
                  </div>
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${colorSystem.secondary}20` }}
                  >
                    <FaVideo
                      className="text-xs"
                      style={{ color: colorSystem.secondary }}
                    />
                  </div>
                </div>
              </div>

              {/* Following Card */}
              <div
                className="p-3 rounded-lg border transition-all duration-200 hover:shadow-sm group"
                style={{
                  backgroundColor: `${colorSystem.warning}08`,
                  borderColor: `${colorSystem.warning}20`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatNumber(
                        parseInt(profileData?.statsV2?.followingCount as any || 0)
                      )}
                    </div>
                    <div className="text-xs text-gray-600">Following</div>
                  </div>
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${colorSystem.warning}20` }}
                  >
                    <FaEye
                      className="text-xs"
                      style={{ color: colorSystem.warning }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Compact CTA Button */}
            <button
              onClick={handleTrackProfile}
              className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-lg hover:scale-[1.01] group"
              style={{
                background: `linear-gradient(135deg, ${colorSystem.primary} 0%, ${colorSystem.secondary} 100%)`,
              }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-white/20 group-hover:rotate-12 transition-transform">
                <FaCheck className="text-xs" />
              </div>
              <span>Start Tracking Profile</span>
            </button>
          </div>
        );
      case "error":
        return (
          <div className="text-center space-y-6 py-4">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colorSystem.accent}20` }}
            >
              <FaExclamationTriangle
                className="text-2xl"
                style={{ color: colorSystem.accent }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Profile Not Found
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setModalState("input")}
                className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: colorSystem.surface,
                  color: colorSystem.primary,
                  border: `1px solid ${colorSystem.border}`,
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur effect */}
      <div
        className="min-h-screen min-w-screen absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false);
          setProfileData(null);
          setModalState("input");
          setUsername("");
        }}
      />

      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl transform transition-all duration-300 scale-100 hover:scale-[1.01]"
          style={{
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px ${colorSystem.border}20`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient background */}
          <div
            className="relative px-6 pt-6 pb-4 rounded-t-3xl"
            style={{
              background: `linear-gradient(135deg, ${colorSystem.primary}08 0%, ${colorSystem.secondary}05 100%)`,
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${colorSystem.primary}15` }}
                >
                  <FaTiktok
                    className="text-lg"
                    style={{ color: colorSystem.primary }}
                  />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 text-lg">
                    TikTok Tracker
                  </span>
                  <p className="text-xs text-gray-500">Profile Analytics</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setProfileData(null);
                  setModalState("input");
                  setUsername("");
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-6 pb-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

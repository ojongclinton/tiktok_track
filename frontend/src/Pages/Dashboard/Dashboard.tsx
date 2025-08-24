import React, { useEffect, useState } from "react";
import TikTokAddCard, {
  TikTokProfileModal,
} from "../../Components/Cards/DashboardProfileCard";
import { useGetTrackedProfiles } from "../../api/ProfilesApi";
import { useSelector } from "react-redux";
import TikTokUserCard from "../../Components/Cards/SingleProfileSummaryCard";
import TikTokUserList from "../../Components/Cards/SingleProfileSummaryList";
import { FiUsers, FiTrendingUp, FiRefreshCw } from "react-icons/fi";
import { CiGrid2H, CiGrid41 } from "react-icons/ci";
import type { UserTrackedProfile } from "../../types/profiles";

function Dashboard() {
  const [openAddModal, setOpenAddModal] = React.useState(false);
  return (
    <div>
      <TikTokProfileModal isOpen={openAddModal} setIsOpen={setOpenAddModal} />
      <div>
        <UserTrackedProfiles setOpenAddModal={setOpenAddModal} />
      </div>
    </div>
  );
}

export default Dashboard;

const UserTrackedProfiles = ({ setOpenAddModal }: { setOpenAddModal: any }) => {
  const user = useSelector((state: any) => state.auth.user);
  const jwtToken = useSelector((state: any) => state.auth.jwtToken);
  const { getTrackedProfiles, isLoading } = useGetTrackedProfiles();

  const [allTracked, setAllTracked] = useState<UserTrackedProfile[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list"); // Default to list view
  const [isRefreshing, setIsRefreshing] = useState(true);

  const fetchUserTrackedProfiles = async () => {
    setIsRefreshing(true);
    try {
      let res = await getTrackedProfiles();
      if (res) {
        setAllTracked(res.trackedProfiles);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user || !jwtToken) return;
    fetchUserTrackedProfiles();
  }, [user, jwtToken]);

  const handleCardClick = (user: UserTrackedProfile) => {
    console.log("Navigate to user details:", user.username);
    // Your navigation logic here
  };

  const handleRefresh = () => {
    fetchUserTrackedProfiles();
  };

  const ViewToggleButton = ({
    icon: Icon,
    label,
    isActive,
    onClick,
  }: {
    icon: any;
    label: string;
    isActive: boolean;
    onClick: any;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        isActive
          ? `bg-[#884AA0] text-white shadow-lg shadow-purple-600/25`
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-purple-200"
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tracked Profiles
              </h1>
              <p className="text-gray-600 flex items-center space-x-2">
                <FiUsers size={16} />
                <span>
                  Monitor and analyze your favorite TikTok creators' growth and
                  performance
                </span>
              </p>
            </div>

            {/* Stats Summary */}
            {allTracked && (
              <div className="flex items-center space-x-6 bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {allTracked.length}
                  </p>
                  <p className="text-xs text-gray-500">Profiles</p>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {
                      allTracked.filter(
                        (u) =>
                          u.previous_followers_count &&
                          u.followers_count > u.previous_followers_count
                      ).length
                    }
                  </p>
                  <p className="text-xs text-gray-500">Growing</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <FiTrendingUp size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {allTracked
                  ? `${allTracked.length} creators being tracked`
                  : "Loading..."}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Add Profile Button */}
              <button
                onClick={() => {
                  setOpenAddModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-[#884AA0] text-white hover:bg-purple-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/25"
              >
                <FiUsers size={16} />
                <span className="text-sm font-medium">Add Profile</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw
                  size={16}
                  className={`${
                    isLoading || isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="text-sm">Refresh</span>
              </button>

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                <ViewToggleButton
                  icon={CiGrid41}
                  label="Grid"
                  isActive={viewMode === "grid"}
                  onClick={() => setViewMode("grid")}
                />
                <ViewToggleButton
                  icon={CiGrid2H}
                  label="List"
                  isActive={viewMode === "list"}
                  onClick={() => setViewMode("list")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State with Skeletons */}
        {(isLoading || isRefreshing) && allTracked.length === 0 && (
          <div className="space-y-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 animate-pulse"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {/* Avatar skeleton */}
                        <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                        <div>
                          {/* Name skeleton */}
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          {/* Username skeleton */}
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                          {/* Tags skeleton */}
                          <div className="flex space-x-2 mt-1">
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>
                      </div>
                      {/* Button skeleton */}
                      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    </div>

                    {/* Stats grid skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                      {[...Array(2)].map((_, statIndex) => (
                        <div
                          key={statIndex}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
                            <div>
                              <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom stats skeleton */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                      {[...Array(2)].map((_, bottomIndex) => (
                        <div
                          key={bottomIndex}
                          className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div>
                            <div className="h-3 bg-gray-200 rounded w-8 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 animate-pulse"
                  >
                    <div className="flex items-center space-x-5">
                      {/* Profile section skeleton */}
                      <div className="flex items-center space-x-4 w-64 flex-shrink-0">
                        {/* Avatar skeleton */}
                        <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          {/* Name skeleton */}
                          <div className="h-4 bg-gray-200 rounded w-28 mb-1"></div>
                          {/* Username skeleton */}
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>

                      {/* Stats section skeleton */}
                      <div className="flex items-center justify-between flex-1">
                        {[...Array(4)].map((_, statIndex) => (
                          <div key={statIndex} className="text-center flex-1">
                            <div className="flex items-center justify-center space-x-1.5 mb-1">
                              <div className="w-3.5 h-3.5 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded w-12"></div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                          </div>
                        ))}
                      </div>

                      {/* Actions skeleton */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allTracked && allTracked.length === 0 && (
          <div className="text-center py-16 h-[400px] w-[400px] m-auto">
            <TikTokAddCard setOpenAddModal={setOpenAddModal} />
          </div>
        )}

        {/* Profiles Grid/List */}
        {allTracked && allTracked.length > 0 && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {allTracked.map((trackedUser) => (
                  <TikTokUserCard
                    key={trackedUser.user_id}
                    user={trackedUser}
                    onCardClick={handleCardClick}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {allTracked.map((trackedUser) => (
                  <TikTokUserList
                    key={trackedUser.user_id}
                    user={trackedUser}
                    onCardClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer Info */}
        {allTracked && allTracked.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

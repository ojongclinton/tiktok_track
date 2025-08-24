const AppSkeletonLoadingEnhanced = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4">
          {/* Logo/Brand */}
          <div
            className="h-8 bg-gray-300 rounded animate-pulse mb-8"
            style={{ animationDelay: "0ms" }}
          ></div>

          {/* Navigation Items */}
          <div className="space-y-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div
                  className="w-5 h-5 bg-gray-300 rounded animate-pulse"
                  style={{ animationDelay: `${index * 100}ms` }}
                ></div>
                <div
                  className="h-4 bg-gray-300 rounded animate-pulse flex-1"
                  style={{ animationDelay: `${index * 100 + 50}ms` }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top App Bar Skeleton */}
        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <div
              className="w-8 h-8 bg-gray-300 rounded animate-pulse"
              style={{ animationDelay: "200ms" }}
            ></div>
            <div
              className="h-6 w-32 bg-gray-300 rounded animate-pulse"
              style={{ animationDelay: "250ms" }}
            ></div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div
              className="w-64 h-8 bg-gray-300 rounded animate-pulse"
              style={{ animationDelay: "300ms" }}
            ></div>
            <div
              className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"
              style={{ animationDelay: "350ms" }}
            ></div>
            <div
              className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"
              style={{ animationDelay: "400ms" }}
            ></div>
          </div>
        </div>

        {/* Content Area Skeleton */}
        <div className="flex-1 overflow-hidden p-6">
          {/* Page Title */}
          <div className="mb-6">
            <div
              className="h-8 w-48 bg-gray-300 rounded animate-pulse mb-2"
              style={{ animationDelay: "500ms" }}
            ></div>
            <div
              className="h-4 w-96 bg-gray-300 rounded animate-pulse"
              style={{ animationDelay: "550ms" }}
            ></div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-3">
              <div
                className="h-9 w-24 bg-gray-300 rounded animate-pulse"
                style={{ animationDelay: "600ms" }}
              ></div>
              <div
                className="h-9 w-20 bg-gray-300 rounded animate-pulse"
                style={{ animationDelay: "650ms" }}
              ></div>
            </div>
            <div
              className="h-9 w-32 bg-gray-300 rounded animate-pulse"
              style={{ animationDelay: "700ms" }}
            ></div>
          </div>

          {/* Content Grid/Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-100"
                style={{ animationDelay: `${800 + index * 100}ms` }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-5 w-24 bg-gray-300 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
                </div>

                {/* Card Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="h-3 w-16 bg-gray-300 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-12 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="h-3 w-12 bg-gray-300 rounded animate-pulse mb-2"></div>
                    <div className="h-5 w-16 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSkeletonLoadingEnhanced;

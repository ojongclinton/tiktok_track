import { useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  CalendarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { classNames } from "../../utils/helpers";
import { Outlet, useLocation, Link, useNavigate } from "react-router";
import companyLogo from "../../assets/logo-transparent-svg.svg";
import { useApiLogoutUser } from "../../api/ProfilesApi";
import { useDispatch } from "react-redux";
import { useGetJwt, useGetUser } from "../../appwrite/auth/AuthApi";
import { login } from "../../slices/authSlice";
import AppSkeletonLoadingEnhanced from "./AppSkeleton";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  {
    name: "Team",
    href: "/team",
    icon: UsersIcon,
    comingSoon: true,
    tooltip: "Agency subscriptions coming soon",
  },
  { name: "Hashtags", href: "/dashboard/hashtags", icon: FolderIcon },
  { name: "Sounds", href: "/dashboard/sounds", icon: CalendarIcon },
  {
    name: "Trending content",
    href: "/dashboard/trending",
    icon: DocumentDuplicateIcon,
  },
  { name: "Reports", href: "/dashboard/reports", icon: ChartPieIcon },
];

const teams = [
  { id: 1, name: "Help", href: "/help", initial: "H" },
  { id: 2, name: "Contact Us", href: "/contact", initial: "C" },
  { id: 3, name: "Follow us", href: "/follow", initial: "F" },
];

const userNavigation = [
  { name: "Your profile", href: "/profile" },
  { name: "Sign out", href: "logout" },
];

export default function Example() {
  const [appLoading, setAppLoading] = useState(true);
  const { logoutUser } = useApiLogoutUser();
  const dispatch = useDispatch();

  const { getUser } = useGetUser();
  const { getJwt } = useGetJwt();

  useEffect(() => {
    const checkUser = async () => {
      try {
        setAppLoading(true);
        await getUser().then(async (data) => {
          const jwtData = await getJwt();

          if (data && jwtData) {
            dispatch(login({ user: data, jwtToken: jwtData.jwt }));
          } else {
            logoutUser();
          }
        });
      } catch (error) {
        logoutUser();
      } finally {
        setAppLoading(false);
      }
    };

    checkUser();
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Function to check if a route is active
  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  // Function to handle navigation item click
  const handleNavClick = (
    item: {
      comingSoon?: boolean;
      tooltip: string;
    },
    e
  ) => {
    if (item.comingSoon) {
      e.preventDefault();
      alert(item.tooltip || "Coming soon!");
      return;
    }
    setSidebarOpen(false);
  };

  // Render navigation item
  interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    comingSoon?: boolean;
    tooltip?: string;
  }

  const renderNavItem = (
    item: NavItem,
    isMobile: boolean = false
  ): React.ReactElement => {
    const isActive = isActiveRoute(item.href);
    const ItemComponent: React.ElementType = item.comingSoon ? "button" : Link;
    const itemProps = item.comingSoon
      ? {
          type: "button",
          onClick: (e: React.MouseEvent<HTMLButtonElement>) =>
            handleNavClick(item, e),
        }
      : {
          to: item.href,
          onClick: (e: React.MouseEvent<HTMLAnchorElement>) =>
            handleNavClick(item, e),
        };

    return (
      <ItemComponent
        key={item.name}
        {...itemProps}
        className={classNames(
          isActive
            ? "bg-gradient-to-r from-[#884AA0]/10 to-[#BB588B]/10 text-[#884AA0] border-r-2 border-[#884AA0]"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-[#FBE0A1]/15 hover:to-[#F9C478]/15 hover:text-[#884AA0]",
          item.comingSoon
            ? "opacity-50 cursor-not-allowed hover:opacity-70"
            : "cursor-pointer",
          "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left relative transition-all duration-200"
        )}
        title={item.tooltip}
        disabled={item.comingSoon}
      >
        <item.icon
          aria-hidden="true"
          className={classNames(
            isActive
              ? "text-[#884AA0]"
              : "text-gray-400 group-hover:text-[#884AA0]",
            "size-6 shrink-0 transition-colors duration-200"
          )}
        />
        <span className="flex-1">{item.name}</span>
        {item.comingSoon && (
          <span className="ml-2 inline-flex items-center rounded-full bg-gradient-to-r from-[#F9C478] to-[#FBE0A1] px-2 py-0.5 text-xs font-medium text-[#884AA0]">
            Soon
          </span>
        )}
        {isActive && (
          <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-[#884AA0] to-[#BB588B] rounded-l-full" />
        )}
      </ItemComponent>
    );
  };

  // Render team item
  const renderTeamItem = (team) => {
    const isActive = isActiveRoute(team.href);

    return (
      <Link
        key={team.name}
        to={team.href}
        onClick={() => setSidebarOpen(false)}
        className={classNames(
          isActive
            ? "bg-gradient-to-r from-[#884AA0]/10 to-[#BB588B]/10 text-[#884AA0]"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-[#FBE0A1]/15 hover:to-[#F9C478]/15 hover:text-[#884AA0]",
          "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold relative transition-all duration-200"
        )}
      >
        <span
          className={classNames(
            isActive
              ? "border-[#884AA0] text-[#884AA0] bg-gradient-to-br from-[#884AA0]/10 to-[#BB588B]/10"
              : "border-gray-200 text-gray-400 group-hover:border-[#884AA0] group-hover:text-[#884AA0] group-hover:bg-gradient-to-br group-hover:from-[#FBE0A1]/15 group-hover:to-[#F9C478]/15",
            "flex size-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium transition-all duration-200"
          )}
        >
          {team.initial}
        </span>
        <span className="truncate flex-1">{team.name}</span>
        {isActive && (
          <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-[#884AA0] to-[#BB588B] rounded-l-full" />
        )}
      </Link>
    );
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex grow flex-col gap-y-5 bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <img alt="Your Company" src={companyLogo} className="scale-[1.3]" />
      </div>

      {/* User info card */}
      <div className="mx-2 p-3 bg-gradient-to-br from-[#FBE0A1]/20 via-[#F9C478]/15 to-[#DD6D6C]/10 rounded-lg border border-[#F9C478]/20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              alt=""
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              className="size-8 rounded-full ring-2 ring-white shadow-sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#884AA0]">Tom Cook</p>
            <p className="text-xs text-gray-500 truncate">Premium Plan</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
              <div className="w-6 h-px bg-gradient-to-r from-[#F9C478] to-[#DD6D6C]"></div>
              Analytics
              <div className="flex-1 h-px bg-gradient-to-r from-[#DD6D6C] to-transparent"></div>
            </div>
            <ul role="list" className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>{renderNavItem(item, isMobile)}</li>
              ))}
            </ul>
          </li>
          <li>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
              <div className="w-6 h-px bg-gradient-to-r from-[#BB588B] to-[#884AA0]"></div>
              Support
              <div className="flex-1 h-px bg-gradient-to-r from-[#884AA0] to-transparent"></div>
            </div>
            <ul role="list" className="space-y-1">
              {teams.map((team) => (
                <li key={team.name}>{renderTeamItem(team)}</li>
              ))}
            </ul>
          </li>
          <li className="mt-auto">
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={classNames(
                isActiveRoute("/settings")
                  ? "bg-gradient-to-r from-[#884AA0]/10 to-[#BB588B]/10 text-[#884AA0]"
                  : "text-gray-700 hover:bg-gradient-to-r hover:from-[#FBE0A1]/15 hover:to-[#F9C478]/15 hover:text-[#884AA0]",
                "group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold relative transition-all duration-200"
              )}
            >
              <Cog6ToothIcon
                aria-hidden="true"
                className={classNames(
                  isActiveRoute("/settings")
                    ? "text-[#884AA0]"
                    : "text-gray-400 group-hover:text-[#884AA0]",
                  "size-6 shrink-0 transition-colors duration-200"
                )}
              />
              <span>Settings</span>
              {isActiveRoute("/settings") && (
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-[#884AA0] to-[#BB588B] rounded-l-full" />
              )}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );

  if (appLoading) {
    return (
      <AppSkeletonLoadingEnhanced />
    );
  }

  return (
    <>
      <div>
        {/* Mobile sidebar */}
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>
              <div className="backdrop-blur-xl bg-white/95 shadow-2xl border-r border-[#F9C478]/20 ">
                <SidebarContent isMobile={true} />
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5  border-r border-gray-100 bg-white/95 backdrop-blur-xl shadow-md">
            <SidebarContent />
          </div>
        </div>

        <div className="lg:pl-72">
          {/* Enhanced top navigation */}
          <div className="sticky top-0 z-40">
            <div className="flex h-16 items-center gap-x-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="-m-2.5 p-2.5 text-gray-700 hover:text-[#884AA0] hover:bg-gradient-to-br hover:from-[#FBE0A1]/20 hover:to-[#F9C478]/20 rounded-xl transition-all duration-200 lg:hidden"
              >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon aria-hidden="true" className="size-6" />
              </button>

              {/* Separator */}
              <div
                aria-hidden="true"
                className="h-8 w-px bg-gradient-to-b from-[#F9C478]/50 to-[#DD6D6C]/50 lg:hidden"
              />

              <div className="flex justify-end flex-1 gap-x-4 self-stretch lg:gap-x-6">
                {/* Enhanced search with gradient border */}

                <div className="flex items-center gap-x-4 lg:gap-x-6">
                  {/* Enhanced notifications */}
                  <button
                    type="button"
                    className="relative -m-2.5 p-3 text-gray-400 hover:text-[#DD6D6C] hover:bg-gradient-to-br hover:from-[#FBE0A1]/20 hover:to-[#F9C478]/20 rounded-xl transition-all duration-200 group"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon
                      aria-hidden="true"
                      className="size-6 group-hover:scale-110 transition-transform duration-200"
                    />
                    <span className="absolute top-2 right-2 size-2.5 bg-gradient-to-br from-[#DD6D6C] to-[#BB588B] rounded-full ring-2 ring-white shadow-sm animate-pulse"></span>
                  </button>

                  {/* Separator */}
                  <div
                    aria-hidden="true"
                    className="hidden lg:block lg:h-8 lg:w-px lg:bg-gradient-to-b lg:from-[#F9C478]/50 lg:to-[#DD6D6C]/50"
                  />

                  {/* Enhanced profile dropdown */}
                  <Menu as="div" className="relative">
                    <MenuButton className="relative flex items-center gap-3 hover:bg-gradient-to-br hover:from-[#FBE0A1]/20 hover:to-[#F9C478]/20 rounded-xl p-2 transition-all duration-200 group">
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">Open user menu</span>
                      <div className="relative">
                        <img
                          alt=""
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                          className="size-9 rounded-full ring-2 ring-white shadow-md group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                      <span className="hidden lg:flex lg:items-center lg:gap-2">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-[#884AA0] transition-colors duration-200">
                          Tom Cook
                        </span>
                        <ChevronDownIcon
                          aria-hidden="true"
                          className="size-5 text-gray-400 group-hover:text-[#884AA0] transition-colors duration-200"
                        />
                      </span>
                    </MenuButton>
                    <MenuItems
                      transition
                      className="absolute right-0 z-10 mt-3 w-56 origin-top-right rounded-2xl bg-white/95 backdrop-blur-xl py-3 shadow-2xl ring-1 ring-[#F9C478]/20 border border-gray-100 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-100 data-leave:ease-in"
                    >
                      {userNavigation.map((item, index) => (
                        <MenuItem key={item.name}>
                          <button
                            onClick={() => {
                              if (item.name === "Sign out") {
                                logoutUser();
                              }
                            }}
                            className={classNames(
                              "flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-[#FBE0A1]/20 hover:to-[#F9C478]/20 hover:text-[#884AA0] transition-all duration-200 data-focus:bg-gradient-to-r data-focus:from-[#FBE0A1]/20 data-focus:to-[#F9C478]/20 data-focus:text-[#884AA0]",
                              index === userNavigation.length - 1
                                ? "border-t border-gray-100 mt-2 pt-3"
                                : ""
                            )}
                          >
                            {item.name === "Sign out" && (
                              <div className="size-2 bg-gradient-to-br from-[#DD6D6C] to-[#BB588B] rounded-full"></div>
                            )}
                            {item.name}
                          </button>
                        </MenuItem>
                      ))}
                    </MenuItems>
                  </Menu>
                </div>
              </div>
            </div>
          </div>

          <main className="py-8 lg:py-10 bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

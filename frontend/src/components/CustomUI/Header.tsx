import React, { useState, useCallback, useMemo } from "react";
import { Menu, Search, User as UserIcon, Camera } from "lucide-react";
import NotificationMenu from "./NotificationMenu";

/* -------------------- Helper Components -------------------- */
export interface HeaderUser {
  name?: string;
  firstName?: string;
  role?: string;
  avatar?: string | null;
  profilePicture?: string | null;
  avatarUrl?: string | null;
}

interface ProfilePictureProps {
  hasProfilePicture: boolean;
  user: HeaderUser;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: () => void;
}

const ProfilePicture = React.memo<ProfilePictureProps>(
  ({ hasProfilePicture, user, isHovered, onMouseEnter, onMouseLeave, onClick }) => (
    <div
      className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer group transition-transform hover:scale-105"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      role="button"
      aria-label="Go to profile settings"
      tabIndex={0}
    >
      {hasProfilePicture ? (
        <img
          src={(user.avatar ?? user.profilePicture) ?? undefined}
          alt={`${user.name || 'User'}'s profile`}
          className="w-full h-full object-cover transition-all group-hover:brightness-75"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center font-semibold text-lg group-hover:bg-slate-800">
          {user?.name?.charAt(0)?.toUpperCase() || <UserIcon className="w-6 h-6" />}
        </div>
      )}

      {isHovered && onClick && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity">
          <Camera className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
);
ProfilePicture.displayName = "ProfilePicture";

interface UserInfoProps {
  name?: string;
  role?: string;
}

const UserInfo = React.memo<UserInfoProps>(({ name, role }) => (
  <div className="text-right hidden sm:block">
    <p className="text-sm font-semibold text-slate-800 leading-tight">{name || 'User'}</p>
    <p className="text-xs text-gray-500 mt-0.5 capitalize">{role}</p>
  </div>
));
UserInfo.displayName = "UserInfo";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchBar = React.memo<SearchBarProps>(({ searchQuery, setSearchQuery }) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery && setSearchQuery(e.target.value), [setSearchQuery]);
  return (
    <div className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={handleChange}
        className="pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-white 
             text-sm w-64 
             transition-shadow duration-200 
             hover:shadow-md 
             focus:outline-none focus:ring-0 focus:border-gray-300"
      />
    </div>
  );
});
SearchBar.displayName = "SearchBar";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  user: HeaderUser;
  onProfileClick?: () => void;
  children?: React.ReactNode;
}

/* -------------------- Header Component -------------------- */
export default function Header({
    sidebarOpen, 
    setSidebarOpen, 
    searchQuery = '', 
    setSearchQuery,
    user,
    onProfileClick,
    children
}: HeaderProps) {
  const [isHovered, setIsHovered] = useState(false);

  const hasProfilePicture = useMemo(() => !!(user?.avatar || user?.profilePicture), [user]);

  const toggleSidebar = useCallback(() => setSidebarOpen(!sidebarOpen), [setSidebarOpen, sidebarOpen]);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <header className="bg-[#F8F9FA] border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between z-30 min-h-[72px]">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        {setSearchQuery && (
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        )}
      </div>

       {/* Middle Widget Section */}
       <div className="flex-1 flex justify-center px-4">
            {children}
       </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <NotificationMenu />

        <div className="flex items-center gap-3">
          <ProfilePicture
            hasProfilePicture={hasProfilePicture}
            user={user || {}}
            isHovered={isHovered}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onProfileClick}
          />

          <UserInfo name={user?.name || user?.firstName} role={user?.role} />
        </div>
      </div>
    </header>
  );
}

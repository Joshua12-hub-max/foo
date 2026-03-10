import { useState, useCallback, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, User, Camera } from "lucide-react";
import EmployeeNotificationMenu from "../../CustomUI/EmployeeNotificationMenu";
import { useAuth } from "../../../hooks/useAuth";
import type { User as UserType } from "@/types";

interface ProfilePictureProps {
  hasProfilePicture: boolean;
  user: UserType | null;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

/* -------------------- Memoized Components -------------------- */
const ProfilePicture = memo<ProfilePictureProps>(
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
          src={user?.avatarUrl ?? undefined}
          alt={`${user?.name ?? 'User'}'s profile`}
          className="w-full h-full object-cover transition-all group-hover:brightness-75"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center font-semibold text-lg group-hover:bg-slate-800">
          {user?.name?.charAt(0)?.toUpperCase() || <User className="w-6 h-6" />}
        </div>
      )}

      {isHovered && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity">
          <Camera className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
);
ProfilePicture.displayName = "ProfilePicture";

interface UserInfoProps {
  name: string;
  role: string;
}

const UserInfo = memo<UserInfoProps>(({ name, role }) => (
  <div className="text-right">
    <p className="text-sm font-semibold text-slate-800 leading-tight">{name}</p>
    <p className="text-xs text-gray-500 mt-0.5 capitalize">{role || "Employee"}</p>
  </div>
));
UserInfo.displayName = "UserInfo";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchBar = memo<SearchBarProps>(({ searchQuery, setSearchQuery }) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery && setSearchQuery(e.target.value), [setSearchQuery]);
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
      <input
        type="text"
        placeholder="Search records..."
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
  onToggleSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/* -------------------- Header Component -------------------- */
export default function Header({
  onToggleSidebar,
  searchQuery,
  setSearchQuery,
}: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  // Check if user has a profile picture - depends on both avatar and profilePicture fields
  const hasProfilePicture = useMemo(() => {
    const avatarUrl = user?.avatarUrl;
    return !!avatarUrl;
  }, [user?.avatarUrl]);

  const handleProfileClick = useCallback(() => {
     navigate('/employee-dashboard/profile');
  }, [navigate]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <header className="bg-[#F8F9FA] border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <EmployeeNotificationMenu />

        <div className="flex items-center gap-3">
          <ProfilePicture
            hasProfilePicture={hasProfilePicture}
            user={user}
            isHovered={isHovered}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleProfileClick}
          />

          <UserInfo name={user?.name || ''} role={user?.role || ''} />
        </div>
      </div>
    </header>
  );
}

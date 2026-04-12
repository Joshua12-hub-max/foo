import { useState, useCallback, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, User as UserIcon, Camera } from "lucide-react";
import NotificationMenu from "../../CustomUI/NotificationMenu";
import { useAuth } from "../../../hooks/useAuth";
import type { User } from "@/types";

/* -------------------- Memoized Components -------------------- */
interface ProfilePictureProps {
  hasProfilePicture: boolean;
  user: User | null;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

const ProfilePicture = memo<ProfilePictureProps>(
  ({ hasProfilePicture, user, isHovered, onMouseEnter, onMouseLeave, onClick }) => (
    <div
      className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 cursor-pointer group transition-transform hover:scale-110 shadow-sm"
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
          className="w-full h-full object-cover transition-all"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-[var(--zed-bg-dark)] text-white flex items-center justify-center font-bold text-lg">
          {user?.name?.charAt(0)?.toUpperCase() || <UserIcon className="w-6 h-6" />}
        </div>
      )}

      {isHovered && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity">
          <Camera className="w-4 h-4 text-white" />
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

const UserInfo = memo<UserInfoProps>(({ name, role }) => (
  <div className="text-right">
    <p className="text-sm font-bold text-[var(--zed-text-dark)] leading-tight">{name}</p>
    <p className="text-xs text-[var(--zed-text-muted)] font-medium mt-0.5 capitalize tracking-wide">{role === "human resource" ? "HR" : role}</p>
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--zed-text-muted)] pointer-events-none" />
      <input
        type="text"
        placeholder="Search records..."
        value={searchQuery}
        onChange={handleChange}
        className="pl-10 pr-4 py-2 rounded-[var(--radius-sm)] border border-[var(--zed-border-light)] bg-[var(--zed-bg-surface)] 
             text-sm w-72 text-[var(--zed-text-dark)] font-medium
             transition-all duration-200 
             hover:border-[var(--zed-border-dark)]
             focus:outline-none focus:ring-1 focus:ring-black focus:border-black focus:bg-white"
      />
    </div>
  );
});
SearchBar.displayName = "SearchBar";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

/* -------------------- Header Component -------------------- */
export default function Header({sidebarOpen, setSidebarOpen, searchQuery = '', setSearchQuery = () => {}}: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const hasProfilePicture = useMemo(() => !!(user?.avatarUrl), [user]);

  const handleProfileClick = useCallback(() => {
     navigate('/admin-dashboard/profile');
  }, [navigate]);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [setSidebarOpen]);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <header className="bg-white border-b border-[var(--zed-border-light)] px-6 py-4 flex items-center justify-between z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--zed-bg-surface)] border border-transparent hover:border-[var(--zed-border-light)] transition-all"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="w-5 h-5 text-[var(--zed-text-dark)]" />
        </button>

        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6">
        <NotificationMenu />

        <div className="flex items-center gap-3 pl-6 border-l border-[var(--zed-border-light)]">
          <UserInfo name={user?.name} role={user?.role} />
          
          <ProfilePicture
            hasProfilePicture={hasProfilePicture}
            user={user}
            isHovered={isHovered}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleProfileClick}
          />
        </div>
      </div>
    </header>
  );
}

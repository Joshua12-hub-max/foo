import { useState, useRef, useCallback, memo, useMemo } from "react";
import { Menu, Search, User, Camera, X, Check } from "lucide-react";
import EmployeeNotificationMenu from "../../CustomUI/EmployeeNotificationMenu";

/* -------------------- Memoized Components -------------------- */
const ProfilePicture = memo(
  ({ hasProfilePicture, user, isHovered, onImageError, onMouseEnter, onMouseLeave, onClick }) => (
    <div
      className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer group transition-transform hover:scale-105"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      role="button"
      aria-label="Change profile picture"
      tabIndex={0}
    >
      {hasProfilePicture ? (
        <img
          src={user.profilePicture}
          alt={`${user.name}'s profile`}
          className="w-full h-full object-cover transition-all group-hover:brightness-75"
          onError={onImageError}
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

const UserInfo = memo(({ name, role }) => (
  <div className="text-right">
    <p className="text-sm font-semibold text-slate-800 leading-tight">{name}</p>
    <p className="text-xs text-gray-500 mt-0.5">{role || "Employee"}</p>
  </div>
));
UserInfo.displayName = "UserInfo";

const SearchBar = memo(({ searchQuery, setSearchQuery }) => {
  const handleChange = useCallback((e) => setSearchQuery && setSearchQuery(e.target.value), [setSearchQuery]);
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

/* -------------------- Header Component -------------------- */
export default function Header({
  onToggleSidebar,
  searchQuery,
  setSearchQuery,
  user: initialUser,
  onProfilePictureChange,
}) {
  const [user, setUser] = useState(initialUser || { name: "Employee", role: "Employee" });
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const hasProfilePicture = useMemo(() => user?.profilePicture && !imageError, [user, imageError]);

  const handleFileChange = useCallback((e) => {
    // Implement file change logic if needed for employee
  }, []);

  const handleProfileClick = useCallback(() => {
     // Optional: Allow employee to change profile pic
  }, []);

  const handleImageError = useCallback(() => setImageError(true), []);
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
          <Menu className="w-5 h-5 text-[#274b46]" />
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
            onImageError={handleImageError}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleProfileClick}
          />

          <UserInfo name={user?.name} role={user?.role} />
        </div>
      </div>
    </header>
  );
}
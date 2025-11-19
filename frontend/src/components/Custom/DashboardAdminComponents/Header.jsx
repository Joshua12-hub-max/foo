import { useState, useRef, useCallback, memo, useMemo } from "react";
import { Menu, Search, User, Camera, X, Check } from "lucide-react";
import NotificationMenu from "../../CustomUI/NotificationMenu";

/* -------------------- Utility: Image Compression -------------------- */
const compressImage = (file, maxSize = 800, quality = 0.8) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
    <p className="text-xs text-gray-500 mt-0.5">{role === "hr" ? "HR Admin" : "Admin"}</p>
  </div>
));
UserInfo.displayName = "UserInfo";

const SearchBar = memo(({ searchQuery, setSearchQuery }) => {
  const handleChange = useCallback((e) => setSearchQuery(e.target.value), [setSearchQuery]);
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
  sidebarOpen,
  setSidebarOpen,
  searchQuery,
  setSearchQuery,
  user: initialUser,
  onProfilePictureChange,
}) {
  const [user, setUser] = useState(initialUser);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const hasProfilePicture = useMemo(() => user?.profilePicture && !imageError, [user, imageError]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Please upload a valid image file.");
    if (file.size > 5 * 1024 * 1024) return alert("Image size should be less than 5MB.");

    const preview = URL.createObjectURL(file);
    setPreviewImage(preview);
    e.target.value = "";
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!previewImage) return;

    const blob = await fetch(previewImage).then((r) => r.blob());
    const compressed = await compressImage(blob);

    setUser((prev) => ({
      ...prev,
      profilePicture: compressed,
    }));

    onProfilePictureChange?.(compressed);
    setPreviewImage(null);
    setImageError(false);
  }, [previewImage, onProfilePictureChange]);

  const handleCancelUpload = useCallback(() => setPreviewImage(null), []);
  const handleProfileClick = useCallback(() => fileInputRef.current?.click(), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [setSidebarOpen]);
  const handleImageError = useCallback(() => setImageError(true), []);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <header className="bg-[#F8F9FA] border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="w-5 h-5 text-[#274b46]" />
        </button>

        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <NotificationMenu />

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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload profile picture"
          />

          <UserInfo name={user?.name} role={user?.role} />
        </div>
      </div>

      {/* Preview Modal////Ito yung modal for uplaod images / profile ni admin */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-semibold mb-4">Preview Profile Picture</h3>
            <img
              src={previewImage}
              alt="Profile preview"
              className="w-40 h-40 rounded-full object-cover mx-auto mb-4"
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={handleConfirmUpload}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-1 hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4" /> Confirm
              </button>
              <button
                onClick={handleCancelUpload}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center gap-1 hover:bg-gray-400 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

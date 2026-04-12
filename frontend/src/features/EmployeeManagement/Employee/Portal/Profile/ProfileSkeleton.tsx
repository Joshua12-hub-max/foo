import React from 'react';

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden mb-12 animate-pulse">
      
      {/* HEADER SKELETON */}
      <div className="bg-gradient-to-br from-[var(--zed-primary)] to-[var(--zed-accent)] p-8 relative opacity-80">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 border border-white/10 shadow-lg"></div>
          </div>
          
          {/* Name & Titles */}
          <div className="flex-1 text-center md:text-left space-y-3 w-full">
            <div className="h-8 bg-white/20 rounded-[var(--radius-md)] w-1/3 mx-auto md:mx-0"></div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <div className="h-6 bg-white/20 rounded-[var(--radius-md)] w-24"></div>
               <div className="h-6 bg-white/20 rounded-[var(--radius-md)] w-20"></div>
               <div className="h-6 bg-white/20 rounded-[var(--radius-md)] w-32"></div>
            </div>
          </div>

          {/* Department */}
          <div className="hidden md:flex flex-col items-end gap-2 w-40">
             <div className="h-3 bg-white/20 rounded w-16"></div>
             <div className="h-6 bg-white/20 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* ACTION BAR SKELETON */}
      <div className="bg-white px-8 py-4 border-b border-[var(--zed-border-light)] flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-100 rounded-[var(--radius-md)]"></div>
            <div className="h-10 w-28 bg-gray-100 rounded-[var(--radius-md)]"></div>
         </div>
         <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-100 rounded-[var(--radius-md)]"></div>
            <div className="h-10 w-28 bg-gray-100 rounded-[var(--radius-md)]"></div>
         </div>
      </div>

      {/* DATA GRID SKELETON */}
      <div className="p-8 space-y-10">
        {[1, 2, 3].map((section) => (
          <div key={section} className="space-y-6">
             {/* Section Title */}
             <div className="flex items-center gap-3 mb-4">
               <div className="w-8 h-8 bg-gray-100 rounded-[var(--radius-md)]"></div>
               <div className="h-5 bg-gray-100 rounded-[var(--radius-md)] w-56"></div>
               <div className="h-px bg-gray-100 flex-grow ml-4"></div>
             </div>
             
             {/* Fields Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex flex-col border border-[var(--zed-border-light)] rounded-[var(--radius-md)] p-4 bg-white h-20 justify-center space-y-3">
                     <div className="h-2.5 bg-gray-50 rounded w-16"></div>
                     <div className="h-4 bg-gray-100 rounded w-full"></div>
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSkeleton;

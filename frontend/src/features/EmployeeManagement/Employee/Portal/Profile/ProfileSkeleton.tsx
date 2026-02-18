import React from 'react';

const ProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-12 animate-pulse">
      
      {/* HEADER SKELETON */}
      <div className="bg-gray-800 p-6 relative">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-gray-700 border-2 border-gray-600 shadow-lg"></div>
          </div>
          
          {/* Name & Titles */}
          <div className="flex-1 text-center md:text-left space-y-3 w-full">
            <div className="h-8 bg-gray-700 rounded w-1/3 mx-auto md:mx-0"></div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
               <div className="h-6 bg-gray-700 rounded w-24"></div>
               <div className="h-6 bg-gray-700 rounded w-20"></div>
               <div className="h-6 bg-gray-700 rounded w-32"></div>
            </div>
          </div>

          {/* Department */}
          <div className="hidden md:flex flex-col items-end gap-2 w-40">
             <div className="h-3 bg-gray-700 rounded w-16"></div>
             <div className="h-6 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* ACTION BAR SKELETON */}
      <div className="bg-white px-6 py-3 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
         </div>
         <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
         </div>
      </div>

      {/* DATA GRID SKELETON */}
      <div className="p-6 space-y-8">
        {[1, 2, 3].map((section) => (
          <div key={section} className="space-y-4">
             {/* Section Title */}
             <div className="flex items-center gap-2 mb-3">
               <div className="w-6 h-6 bg-gray-200 rounded"></div>
               <div className="h-4 bg-gray-200 rounded w-48"></div>
               <div className="h-px bg-gray-200 flex-grow ml-2"></div>
             </div>
             
             {/* Fields Grid */}
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="flex flex-col border border-gray-200 rounded-md p-2 bg-white h-16 justify-center space-y-2">
                     <div className="h-3 bg-gray-200 rounded w-20"></div>
                     <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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

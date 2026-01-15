import { memo } from 'react';

interface KanbanSkeletonProps {
  columns?: number;
  cardsPerColumn?: number;
}

const KanbanSkeleton = memo(({ columns = 4, cardsPerColumn = 3 }: KanbanSkeletonProps) => {
  return (
    <div className="flex h-full gap-4 pb-4 overflow-x-auto min-h-[calc(100vh-140px)]">
      {Array.from({ length: columns }).map((_, c) => (
        <div key={`col-${c}`} className="flex-1 min-w-[280px] max-w-[320px] bg-gray-50 rounded-xl p-4 animate-pulse">
            {/* Column Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="h-4 bg-gray-200 rounded-md w-24"></div>
                <div className="h-6 w-8 bg-gray-200 rounded-full"></div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
                {Array.from({ length: cardsPerColumn }).map((_, i) => (
                    <div key={`card-${c}-${i}`} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm h-32 flex flex-col justify-between">
                         <div className="space-y-2">
                             <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                             <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                         </div>
                         <div className="flex justify-between items-center mt-3">
                             <div className="h-6 w-6 bg-gray-100 rounded-full"></div>
                             <div className="h-3 w-16 bg-gray-50 rounded"></div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
      ))}
    </div>
  );
});

KanbanSkeleton.displayName = 'KanbanSkeleton';
export default KanbanSkeleton;

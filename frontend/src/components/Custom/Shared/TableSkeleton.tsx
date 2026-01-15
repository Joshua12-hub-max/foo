import { memo } from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  hasActions?: boolean;
}

const TableSkeleton = memo(({ rows = 5, cols = 4, hasActions = true }: TableSkeletonProps) => {
  return (
    <div className='w-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-pulse'>
      {/* Header Skeleton */}
      <div className="flex items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={`head-${i}`} className={`h-4 bg-gray-200 rounded-md ${i === 0 ? 'w-32' : 'flex-1'}`}></div>
        ))}
        {hasActions && <div className="w-10 h-4 bg-gray-200 rounded-md"></div>}
      </div>

      {/* Rows Skeleton */}
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, r) => (
           <div key={`row-${r}`} className="flex items-center px-6 py-4 gap-4">
             {Array.from({ length: cols }).map((_, c) => (
               <div key={`cell-${r}-${c}`} className={`h-3.5 bg-gray-100 rounded-md ${c === 0 ? 'w-24' : 'flex-1'}`}></div>
             ))}
             {hasActions && <div className="w-8 h-8 rounded-full bg-gray-100"></div>}
           </div>
        ))}
      </div>
    </div>
  );
});

TableSkeleton.displayName = 'TableSkeleton';
export default TableSkeleton;

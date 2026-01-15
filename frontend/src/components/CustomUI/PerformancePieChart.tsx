import { useMemo, useState } from "react";

interface ReportData {
  outstanding?: number;
  exceedsExpectations?: number;
  meetsExpectations?: number;
  needsImprovement?: number;
  poorPerformance?: number;
}

interface PerformancePieChartProps {
  reportData?: ReportData | ReportData[];
  isLoading?: boolean;
}

interface ChartItem {
  label: string;
  value: number;
  color: string;
  // added properties
  index?: number;
  percentage?: string;
  path?: string;
  isFull?: boolean;
}

export default function PerformancePieChart({ reportData = [], isLoading = false }: PerformancePieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Transform data - accepts either array format or single object
  const chartData: ChartItem[] = useMemo(() => {
    // Handle empty or invalid data
    if (!reportData || (Array.isArray(reportData) && !reportData.length)) return [];
    
    // Get the data object (supports both array and object input)
    const data = Array.isArray(reportData) ? reportData[0] : reportData;
    if (!data) return [];

    return [
      { label: 'Outstanding', value: data.outstanding || 0, color: '#172554' }, // Blue 950 (Deep Navy)
      { label: 'Exceeds Expectations', value: data.exceedsExpectations || 0, color: '#1e3a8a' }, // Blue 900
      { label: 'Meets Expectations', value: data.meetsExpectations || 0, color: '#064e3b' }, // Emerald 900
      { label: 'Needs Improvement', value: data.needsImprovement || 0, color: '#78350f' }, // Amber 900
      { label: 'Poor Performance', value: data.poorPerformance || 0, color: '#450a0a' }, // Red 950
    ].filter(item => item.value > 0);
  }, [reportData]);

  const totalValue = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  const segments = useMemo(() => {
    if (totalValue === 0) return [];
    let cumulative = 0;
    
    // Check if there is only one segment (100%)
    if (chartData.length === 1) {
       return [{
           ...chartData[0],
           index: 0,
           percentage: "100.0",
           path: `M 150 50 A 100 100 0 1 1 149.9 50 Z M 150 85 A 65 65 0 1 0 150.1 85 Z`, // Full annulus
           isFull: true
       }];
    }

    return chartData.map((item, index) => {
      const percentage = item.value / totalValue;
      const startAngle = (cumulative / totalValue) * 360;
      cumulative += item.value;
      const endAngle = (cumulative / totalValue) * 360;

      // Calculate path
      const outerRadius = 100;
      const innerRadius = 65;
      const cx = 150;
      const cy = 150;

      // Convert degrees to radians and adjust for SVG coordinate system (start at top -90deg)
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = cx + outerRadius * Math.cos(startRad);
      const y1 = cy + outerRadius * Math.sin(startRad);
      const x2 = cx + outerRadius * Math.cos(endRad);
      const y2 = cy + outerRadius * Math.sin(endRad);

      const x3 = cx + innerRadius * Math.cos(endRad);
      const y3 = cy + innerRadius * Math.sin(endRad);
      const x4 = cx + innerRadius * Math.cos(startRad);
      const y4 = cy + innerRadius * Math.sin(startRad);

      const largeArc = percentage > 0.5 ? 1 : 0;

      return {
        ...item,
        index,
        percentage: (percentage * 100).toFixed(1),
        path: `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`,
        isFull: false
      };
    });
  }, [chartData, totalValue]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-blue-600"></div>
        <p className="text-sm text-gray-500 mt-3 font-medium">Updating metrics...</p>
      </div>
    );
  }

  // Empty state
  if (totalValue === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">No Data Available</h4>
        <p className="text-xs text-gray-500 max-w-[200px]">
          Performance reviews have not been conducted yet.
        </p>
      </div>
    );
  }

  const activeSegment = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
      {/* Chart */}
      <div className="relative w-[280px] h-[280px] shrink-0">
        <svg
          width="280"
          height="280"
          viewBox="0 0 300 300"
          className="drop-shadow-lg"
        >
          {/* Center Text */}
          <g className="pointer-events-none transition-all duration-300">
            <text x="150" y="145" textAnchor="middle" className="text-3xl font-extrabold fill-gray-800" dy=".3em">
              {activeSegment ? `${activeSegment.percentage}%` : totalValue}
            </text>
            <text x="150" y="172" textAnchor="middle" className="text-[11px] font-bold fill-gray-500 uppercase tracking-widest px-2">
              {activeSegment ? 'OF TOTAL' : 'REVIEWS'}
            </text>
          </g>

          {/* Segments */}
          {segments.map((seg, i) => (
            <path
              key={seg.label}
              d={seg.path}
              fill={seg.color}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-300 ease-out cursor-pointer hover:opacity-90 outline-none"
              style={{
                transformOrigin: "150px 150px",
                transform: hoveredIndex === i ? "scale(1.05)" : "scale(1)",
                opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.4 : 1
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
      </div>

      {/* Detailed Legend */}
      <div className="w-full max-w-[260px] flex flex-col gap-2">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating Category</span>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Count</span>
        </div>
        {chartData.map((item, index) => {
             const percent = ((item.value / totalValue) * 100).toFixed(1);
             return (
              <div 
                key={item.label}
                className={`flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredIndex === index ? 'bg-gray-100 shadow-sm scale-[1.02]' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3.5 h-3.5 rounded-md shadow-sm" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold leading-tight ${
                        hoveredIndex === index ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                        {item.label}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">{percent}%</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">
                  {item.value}
                </span>
              </div>
            );
        })}
      </div>
    </div>
  );
}

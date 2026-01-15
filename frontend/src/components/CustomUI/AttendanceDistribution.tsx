import { useMemo, useState } from "react";

interface DistributionItem {
  value: number;
  label: string;
  color?: string;
  // properties added internally
  index?: number;
  path?: string;
  percentage?: string;
}

interface AttendanceDistributionProps {
  data?: DistributionItem[];
}

export default function AttendanceDistribution({ data = [] }: AttendanceDistributionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  const segments = useMemo(() => {
    if (total === 0) return [];
    let cumulative = 0;
    return data.map((item, index) => {
      const startAngle = (cumulative / total) * 360 - 90;
      cumulative += item.value;
      const endAngle = (cumulative / total) * 360 - 90;

      const outerRadius = 100;
      const innerRadius = 65;

      const startOuter = [
        150 + outerRadius * Math.cos((Math.PI / 180) * startAngle),
        150 + outerRadius * Math.sin((Math.PI / 180) * startAngle),
      ];
      const endOuter = [
        150 + outerRadius * Math.cos((Math.PI / 180) * endAngle),
        150 + outerRadius * Math.sin((Math.PI / 180) * endAngle),
      ];
      const startInner = [
        150 + innerRadius * Math.cos((Math.PI / 180) * endAngle),
        150 + innerRadius * Math.sin((Math.PI / 180) * endAngle),
      ];
      const endInner = [
        150 + innerRadius * Math.cos((Math.PI / 180) * startAngle),
        150 + innerRadius * Math.sin((Math.PI / 180) * startAngle),
      ];

      const largeArc = item.value / total > 0.5 ? 1 : 0;

      return {
        ...item,
        index,
        path: `M${startOuter[0]} ${startOuter[1]} A${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter[0]} ${endOuter[1]} L${startInner[0]} ${startInner[1]} A${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner[0]} ${endInner[1]} Z`,
        percentage: ((item.value / total) * 100).toFixed(1)
      };
    });
  }, [data, total]);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400">
        <p>No distribution data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
      {/* Chart */}
      <div className="relative w-[300px] h-[300px] shrink-0">
        <svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          className="drop-shadow-xl"
        >
          <defs>
            <filter id="glow-dist" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Center Text */}
          <g className="pointer-events-none">
            <circle cx="150" cy="150" r="55" fill="white" className="shadow-inner" />
            <text x="150" y="145" textAnchor="middle" className="text-3xl font-bold fill-gray-800" dy=".3em">
              {hoveredIndex !== null ? `${segments[hoveredIndex].value}%` : total}
            </text>
            <text x="150" y="170" textAnchor="middle" className="text-xs font-medium fill-gray-500 uppercase tracking-wider">
              {hoveredIndex !== null ? segments[hoveredIndex].label : 'Total'}
            </text>
          </g>

          {/* Segments */}
          {segments.map((seg, i) => (
            <path
              key={seg.label}
              d={seg.path}
              fill={seg.color}
              className="transition-all duration-300 ease-out cursor-pointer hover:opacity-90"
              style={{
                transformOrigin: "150px 150px",
                transform: hoveredIndex === i ? "scale(1.05)" : "scale(1)",
                opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.6 : 1
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        {data.map((item, index) => (
          <div 
            key={item.label}
            className={`flex items-center justify-between p-2 rounded-lg transition-all duration-200 cursor-pointer ${
              hoveredIndex === index ? 'bg-gray-50 shadow-sm transform scale-105' : 'hover:bg-gray-50'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" 
                style={{ backgroundColor: item.color }}
              />
              <span className={`text-sm font-medium ${
                hoveredIndex === index ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

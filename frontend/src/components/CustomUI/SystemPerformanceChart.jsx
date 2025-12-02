import { useMemo, useState } from "react";

export default function SystemPerformanceChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Default data if none provided
  const chartData = data.length ? data : [
    { label: 'Server Load', value: 45, color: '#79B791' }, // Matching StatCard Present color
    { label: 'Memory', value: 62, color: '#2C497F' },      // Matching StatCard On-Leave color
    { label: 'Disk I/O', value: 28, color: '#CF9033' },    // Matching StatCard Late color
    { label: 'Network', value: 75, color: '#778797' },     // Matching StatCard Hired color
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  // Chart dimensions
  const width = 300;
  const height = 200;
  const padding = 20;
  const barWidth = 40;
  const gap = (width - (padding * 2) - (barWidth * chartData.length)) / (chartData.length - 1);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((tick, i) => {
            const y = height - padding - (tick / 100) * (height - 2 * padding);
            return (
              <g key={tick}>
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke="#e5e7eb" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={0} 
                  y={y + 4} 
                  className="text-[10px] fill-gray-400" 
                  textAnchor="end"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map((item, i) => {
            const x = padding + i * (barWidth + gap);
            const barHeight = (item.value / 100) * (height - 2 * padding);
            const y = height - padding - barHeight;

            return (
              <g 
                key={item.label}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color}
                  rx={4}
                  className={`transition-all duration-300 ${
                    hoveredIndex === i ? 'opacity-100 filter brightness-110' : 'opacity-80'
                  }`}
                />
                {/* Tooltip-ish value on hover */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className={`text-xs font-bold fill-gray-700 transition-opacity duration-200 ${
                    hoveredIndex === i ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {item.value}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend/Labels */}
      <div className="flex justify-between w-full max-w-[300px] mt-4 px-2">
        {chartData.map((item, i) => (
          <div key={item.label} className="flex flex-col items-center text-center">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider truncate w-16">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

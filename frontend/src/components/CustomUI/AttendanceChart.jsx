import { useMemo, useState } from "react";

export default function AttendanceChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

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

      const outerRadius = 98;
      const innerRadius = 60;

      const startOuter = [
        140 + outerRadius * Math.cos((Math.PI / 180) * startAngle),
        140 + outerRadius * Math.sin((Math.PI / 180) * startAngle),
      ];
      const endOuter = [
        140 + outerRadius * Math.cos((Math.PI / 180) * endAngle),
        140 + outerRadius * Math.sin((Math.PI / 180) * endAngle),
      ];
      const startInner = [
        140 + innerRadius * Math.cos((Math.PI / 180) * endAngle),
        140 + innerRadius * Math.sin((Math.PI / 180) * endAngle),
      ];
      const endInner = [
        140 + innerRadius * Math.cos((Math.PI / 180) * startAngle),
        140 + innerRadius * Math.sin((Math.PI / 180) * startAngle),
      ];

      const largeArc = item.value / total > 0.5 ? 1 : 0;

      return {
        ...item,
        index,
        path: `M${startOuter[0]} ${startOuter[1]} A${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter[0]} ${endOuter[1]} L${startInner[0]} ${startInner[1]} A${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner[0]} ${endInner[1]} Z`,
        startAngle,
        endAngle
      };
    });
  }, [data, total]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="flex items-center gap-4">
        {/* Legend - Left Side */}
        <div className="flex flex-col gap-3">
          {data.map((item, index) => (
            <div 
              key={item.label} 
              className="flex items-center gap-3 cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.4,
              }}
            >
              <div
                className="w-7 h-7 rounded transition-all duration-200"
                style={{ 
                  backgroundColor: item.color,
                  transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-tight">
                  {item.value}%
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart - Right Side */}
        <div className="relative" style={{ width: "300px", height: "300px" }}>
          <svg
            width="300"
            height="300"
            viewBox="0 0 300 300"
            className="relative z-10 drop-shadow-lg"
          >
            <defs>
              {segments.map((seg, i) => (
                <filter key={i} id={`shadow-${i}`}>
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.2"/>
                </filter>
              ))}
              <radialGradient id="innerCircle">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="100%" stopColor="#f8f9fa"/>
              </radialGradient>
            </defs>
            
            {/* Segments */}
            {segments.map((seg, i) => (
              <g key={seg.label}>
                <path
                  d={seg.path}
                  fill={seg.color}
                  filter={`url(#shadow-${i})`}
                  className="transition-all duration-300 cursor-pointer"
                  style={{ 
                    transformOrigin: "140px 140px",
                    opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.5,
                    transform: hoveredIndex === i ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <title>{`${seg.label}: ${seg.value}%`}</title>
                </path>
              </g>
            ))}
            
            {/* Inner white circle with shadow */}
            <circle
              cx="140"
              cy="140"
              r="60"
              fill="url(#innerCircle)"
              filter="url(#shadow-0)"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

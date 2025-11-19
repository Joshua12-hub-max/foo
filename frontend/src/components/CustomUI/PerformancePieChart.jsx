import { useMemo, useState } from "react";

const mockReportData = [
  {
    outstanding: 5,
    exceedsExpectations: 15,
    meetsExpectations: 50,
    needsImprovement: 10,
    poorPerformance: 5,
  }
];

export default function PerformancePieChart({ reportData = mockReportData }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const chartData = useMemo(() => {
    if (!reportData.length) {
      return [];
    }

    const totals = reportData.reduce((acc, curr) => {
      acc.outstanding += curr.outstanding || 0;
      acc.exceedsExpectations += curr.exceedsExpectations || 0;
      acc.meetsExpectations += curr.meetsExpectations || 0;
      acc.needsImprovement += curr.needsImprovement || 0;
      acc.poorPerformance += curr.poorPerformance || 0;
      return acc;
    }, { outstanding: 0, exceedsExpectations: 0, meetsExpectations: 0, needsImprovement: 0, poorPerformance: 0 });

    return [
      { label: 'Outstanding', value: totals.outstanding, color: '#462255' },
      { label: 'Exceeds Expectations', value: totals.exceedsExpectations, color: '#034C5F' },
      { label: 'Meets Expectations', value: totals.meetsExpectations, color: '#97BEC6' },
      { label: 'Needs Improvement', value: totals.needsImprovement, color: '#F9C4BA' },
      { label: 'Poor Performance', value: totals.poorPerformance, color: '#EE6457' },
    ].filter(item => item.value > 0);
  }, [reportData]);

  const totalValue = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  const segments = useMemo(() => {
    if (totalValue === 0) return [];
    let cumulative = 0;
    return chartData.map((item) => {
      const percentage = item.value / totalValue;
      const startAngle = (cumulative / totalValue) * 360 - 90;
      cumulative += item.value;
      const endAngle = (cumulative / totalValue) * 360 - 90;

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
        140 + innerRadius * Math.cos((Math.PI / 180) * startAngle),
        140 + innerRadius * Math.sin((Math.PI / 180) * startAngle),
      ];
      const endInner = [
        140 + innerRadius * Math.cos((Math.PI / 180) * endAngle),
        140 + innerRadius * Math.sin((Math.PI / 180) * endAngle),
      ];

      const largeArc = percentage > 0.5 ? 1 : 0;

      return {
        ...item,
        percentage: (percentage * 100).toFixed(1),
        path: `M${startOuter[0]} ${startOuter[1]} A${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter[0]} ${endOuter[1]} L${endInner[0]} ${endInner[1]} A${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner[0]} ${startInner[1]} Z`,
      };
    });
  }, [chartData, totalValue]);

  if (!reportData.length || totalValue === 0) {
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
          {segments.map((item, index) => (
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
                  {item.percentage}%
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
              {segments.map((_seg, i) => (
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
                  <title>{`${seg.label}: ${seg.value} (${seg.percentage}%)`}</title>
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
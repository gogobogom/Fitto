'use client';

interface CalorieCircleProps {
  consumed: number;
  burned: number;
  target: number;
}

export function CalorieCircle({ consumed, burned, target }: CalorieCircleProps) {
  const netCalories = consumed - burned;
  const remaining = target - netCalories;
  const percentage = Math.min((netCalories / target) * 100, 100);
  
  // SVG Circle parameters
  const size = 280;
  const strokeWidth = 26;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative wiggle" style={{ width: size, height: size }}>
        {/* Doodle-style outer ring */}
        <svg className="absolute inset-0" width={size} height={size}>
          <defs>
            <filter id="rough">
              <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" seed="2" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
            </filter>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius + 2}
            stroke="#000"
            strokeWidth="3"
            fill="none"
            strokeDasharray="4,4"
            className="rotate-tilt"
          />
        </svg>

        {/* Background Circle */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
            filter="url(#rough)"
          />
          {/* Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={remaining >= 0 ? '#10B981' : '#EF4444'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
            filter="url(#rough)"
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold text-gray-900 font-doodle">
            {remaining >= 0 ? Math.round(remaining) : 0}
          </div>
          <div className="text-sm text-gray-600 mt-1 font-doodle-alt">kalan kalori</div>
          <div className="mt-4 text-center">
            <div className="text-xs text-gray-500 font-doodle-alt">Tüketilen</div>
            <div className="text-xl font-semibold text-gray-900 font-doodle">{Math.round(consumed)}</div>
          </div>
        </div>
      </div>
      
      {/* Stats with doodle cards */}
      <div className="flex items-center gap-6 mt-6">
        <div className="text-center doodle-border p-3 bg-white border-orange-500">
          <div className="text-xs text-gray-500 font-doodle-alt">Hedef</div>
          <div className="text-2xl font-bold text-gray-900 font-doodle">{target}</div>
        </div>
        <div className="w-1 h-12 bg-gray-900 transform rotate-12"></div>
        <div className="text-center doodle-border p-3 bg-white border-red-500">
          <div className="text-xs text-gray-500 font-doodle-alt">Yakılan</div>
          <div className="text-2xl font-bold text-orange-600 font-doodle">{Math.round(burned)}</div>
        </div>
      </div>
    </div>
  );
}

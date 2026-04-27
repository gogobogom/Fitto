'use client';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: 'green' | 'blue' | 'yellow';
  unit?: string;
}

const colorClasses = {
  green: {
    bg: 'bg-green-100',
    fill: 'bg-green-500',
    text: 'text-green-700',
    border: 'border-green-600',
  },
  blue: {
    bg: 'bg-blue-100',
    fill: 'bg-blue-500',
    text: 'text-blue-700',
    border: 'border-blue-600',
  },
  yellow: {
    bg: 'bg-yellow-100',
    fill: 'bg-yellow-500',
    text: 'text-yellow-700',
    border: 'border-yellow-600',
  },
};

export function MacroBar({ label, current, target, color, unit = 'g' }: MacroBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const colors = colorClasses[color];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-gray-700 font-doodle">{label}</span>
        <span className="text-sm font-semibold text-gray-900 font-doodle">
          {Math.round(current)} / {target}{unit}
        </span>
      </div>
      {/* Doodle-style progress bar */}
      <div className={`relative w-full h-4 ${colors.bg} overflow-hidden`}
           style={{
             borderRadius: '20px 18px 22px 19px/19px 22px 18px 20px',
             border: '2.5px solid #000',
             boxShadow: '2px 2px 0px rgba(0,0,0,0.15)'
           }}>
        <div
          className={`h-full ${colors.fill} transition-all duration-500 relative`}
          style={{ 
            width: `${percentage}%`,
            borderRadius: '18px 16px 20px 17px/17px 20px 16px 18px',
          }}
        >
          {/* Doodle shine effect */}
          <div className="absolute top-1 left-2 w-1/3 h-1 bg-white/40 rounded-full"></div>
        </div>
        {/* Doodle hash marks */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-0.5 bg-black/20"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>
    </div>
  );
}

import React from 'react';

type Color = 'blue' | 'green' | 'orange' | 'cyan';

const shadows: Record<Color, string> = {
  blue: '0 4px 14px 0 rgba(96, 165, 250, 0.39)',
  green: '0 4px 14px 0 rgba(52, 211, 153, 0.39)',
  orange: '0 4px 14px 0 rgba(251, 146, 60, 0.39)',
  cyan: '0 4px 14px 0 rgba(34, 211, 238, 0.39)',
};

const valueColors: Record<Color, string> = {
  blue: '#60a5fa',
  green: '#34d399',
  orange: '#fb923c',
  cyan: '#22d3ee',
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  color?: Color;
  className?: string;
}

export function StatCard({ label, value, color = 'blue', className = '' }: StatCardProps) {
  return (
    <div
      className={`stat-card-${color} rounded-lg border border-[#374151] bg-[#111827] p-4 transition-all duration-300 ${className}`}
      style={{ boxShadow: shadows[color] }}
    >
      <div className="mb-3 text-base font-medium text-white">{label}</div>
      <div className="text-[42px] font-bold leading-tight" style={{ color: valueColors[color] }}>
        {value}
      </div>
    </div>
  );
}

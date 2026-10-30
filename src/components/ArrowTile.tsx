import React from 'react';
import { Arrow, ArrowColor } from '../game/types';
import { getDirectionAngle } from '../game/rules';

interface ArrowTileProps {
  arrow: Arrow;
  cellSize: number;
  isEscaping: boolean;
  isBlocked: boolean;
  isHinted: boolean;
  theme: 'dark' | 'light';
  escapeOffset?: { x: number; y: number };
  onTap: (arrow: Arrow) => void;
}

const COLOR_MAP: Record<ArrowColor, { bg: string; shadow: string; border: string; highlight: string; bevel: string }> = {
  cyan: {
    bg: 'bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-600',
    shadow: 'shadow-cyan-500/35',
    border: 'border-cyan-200/50',
    highlight: 'bg-white/30',
    bevel: 'border-b-blue-800/40',
  },
  teal: {
    bg: 'bg-gradient-to-b from-teal-400 via-emerald-500 to-teal-700',
    shadow: 'shadow-teal-500/35',
    border: 'border-teal-200/50',
    highlight: 'bg-white/30',
    bevel: 'border-b-teal-900/40',
  },
  coral: {
    bg: 'bg-gradient-to-b from-rose-400 via-pink-500 to-rose-600',
    shadow: 'shadow-rose-500/35',
    border: 'border-rose-200/50',
    highlight: 'bg-white/30',
    bevel: 'border-b-rose-900/40',
  },
  amber: {
    bg: 'bg-gradient-to-b from-amber-300 via-amber-500 to-yellow-600',
    shadow: 'shadow-amber-500/35',
    border: 'border-amber-100/50',
    highlight: 'bg-white/35',
    bevel: 'border-b-amber-800/40',
  },
  violet: {
    bg: 'bg-gradient-to-b from-violet-400 via-purple-500 to-indigo-600',
    shadow: 'shadow-violet-500/35',
    border: 'border-violet-200/50',
    highlight: 'bg-white/30',
    bevel: 'border-b-indigo-900/40',
  },
  rose: {
    bg: 'bg-gradient-to-b from-pink-400 via-rose-500 to-red-600',
    shadow: 'shadow-pink-500/35',
    border: 'border-pink-200/50',
    highlight: 'bg-white/30',
    bevel: 'border-b-red-900/40',
  },
  emerald: {
    bg: 'bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-700',
    shadow: 'shadow-emerald-500/35',
    border: 'border-emerald-200/50',
    highlight: 'bg-white/30',
    bevel: 'border-b-emerald-900/40',
  },
  indigo: {
    bg: 'bg-gradient-to-b from-indigo-400 via-blue-600 to-indigo-800',
    shadow: 'shadow-indigo-500/35',
    border: 'border-indigo-200/50',
    highlight: 'bg-white/30',
    bevel: 'border-b-indigo-950/40',
  },
};

export const ArrowTile: React.FC<ArrowTileProps> = ({
  arrow,
  cellSize,
  isEscaping,
  isBlocked,
  isHinted,
  theme,
  escapeOffset,
  onTap,
}) => {
  const angle = getDirectionAngle(arrow.direction);
  const colorStyle = COLOR_MAP[arrow.color || 'cyan'];

  // Base position on the board
  const left = arrow.x * cellSize;
  const top = arrow.y * cellSize;

  // Scale internal elements dynamically with cell size
  const iconSize = Math.max(26, Math.floor(cellSize * 0.52));
  const strokeWidth = Math.max(3.2, Math.min(4.8, cellSize * 0.055));
  const padding = Math.max(3, Math.floor(cellSize * 0.07));
  const borderRadius = Math.max(14, Math.floor(cellSize * 0.28));

  // Escape transform coordinates
  const transformStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${cellSize}px`,
    height: `${cellSize}px`,
    padding: `${padding}px`,
    transform: isEscaping && escapeOffset
      ? `translate3d(${escapeOffset.x}px, ${escapeOffset.y}px, 0) scale(0.92)`
      : undefined,
    transition: isEscaping
      ? 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.24s ease-out'
      : undefined,
    opacity: isEscaping ? 0 : 1,
    zIndex: isEscaping ? 40 : isHinted ? 30 : 20,
    pointerEvents: isEscaping ? 'none' : 'auto',
  };

  return (
    <div style={transformStyle}>
      <button
        type="button"
        data-arrow-id={arrow.id}
        aria-label={`Arrow at column ${arrow.x + 1}, row ${arrow.y + 1} pointing ${arrow.direction}`}
        onClick={() => onTap(arrow)}
        className={`w-full h-full flex items-center justify-center relative cursor-pointer
          border ${colorStyle.border} ${colorStyle.bg}
          shadow-lg ${colorStyle.shadow}
          active:scale-95 transition-transform duration-100 ease-out
          ${isBlocked ? 'animate-wiggle ring-4 ring-rose-400' : ''}
          ${isHinted ? 'animate-hint-pulse ring-4 ring-amber-400 shadow-amber-400/50' : ''}
        `}
        style={{
          borderRadius: `${borderRadius}px`,
          boxShadow:
            theme === 'dark'
              ? '0 8px 16px -2px rgba(0, 0, 0, 0.5), inset 0 2px 3px rgba(255, 255, 255, 0.4), inset 0 -3px 4px rgba(0, 0, 0, 0.25)'
              : '0 8px 16px -2px rgba(0, 0, 0, 0.25), inset 0 2px 3px rgba(255, 255, 255, 0.45), inset 0 -3px 4px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Subtle glossy top specular arc */}
        <div
          className={`absolute inset-x-2 top-1.5 h-[32%] ${colorStyle.highlight} rounded-t-xl pointer-events-none`}
        />

        {/* Direction Arrow SVG */}
        <div
          className="transition-transform duration-200 drop-shadow-md flex items-center justify-center pointer-events-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
            className="text-white"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Bold aerodynamic arrow shaft and head */}
            <path d="M16 6 L16 26" stroke="white" />
            <path d="M8 14 L16 6 L24 14" stroke="white" />
          </svg>
        </div>

        {/* Direction accent indicator dot for instant visual recognition */}
        <div
          className="absolute w-2 h-2 rounded-full bg-white/90 shadow-sm pointer-events-none"
          style={{
            top: arrow.direction === 'up' ? '6px' : undefined,
            bottom: arrow.direction === 'down' ? '6px' : undefined,
            left: arrow.direction === 'left' ? '6px' : undefined,
            right: arrow.direction === 'right' ? '6px' : undefined,
          }}
        />
      </button>
    </div>
  );
};

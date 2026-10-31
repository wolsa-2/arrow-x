import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Arrow } from '../game/types';
import {
  buildArrowTrack,
  getArrowRenderData,
  SlicedArrowRenderData,
} from '../game/pathAnimation';

interface WindingArrowProps {
  arrow: Arrow;
  cellSize: number;
  boardCols: number;
  boardRows: number;
  isEscaping: boolean;
  isBlocked: boolean;
  isHinted: boolean;
  onTap: (arrow: Arrow) => void;
  onEscapeFinished?: (arrowId: string) => void;
}

export const WindingArrow: React.FC<WindingArrowProps> = ({
  arrow,
  cellSize,
  boardCols,
  boardRows,
  isEscaping,
  isBlocked,
  isHinted,
  onTap,
  onEscapeFinished,
}) => {
  // Pre-calculate polyline track and kinematic unbending parameters
  const track = useMemo(
    () => buildArrowTrack(arrow, cellSize, boardCols, boardRows),
    [arrow, cellSize, boardCols, boardRows]
  );

  const [animElapsed, setAnimElapsed] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const onEscapeFinishedRef = useRef(onEscapeFinished);
  onEscapeFinishedRef.current = onEscapeFinished;

  useEffect(() => {
    if (!isEscaping) {
      setAnimElapsed(0);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    let startTime: number | null = null;
    const totalMs = track.totalDurationMs;

    const animate = (time: number) => {
      if (startTime === null) startTime = time;
      const elapsed = time - startTime;

      setAnimElapsed(elapsed);

      if (elapsed < totalMs) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = null;
        if (onEscapeFinishedRef.current) {
          onEscapeFinishedRef.current(arrow.id);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [arrow.id, isEscaping, track]);

  // Compute rendered SVG geometry for current phase
  const renderData: SlicedArrowRenderData | null = useMemo(() => {
    if (!isEscaping) {
      return getArrowRenderData(track, 0);
    }
    return getArrowRenderData(track, animElapsed);
  }, [track, isEscaping, animElapsed]);

  // If the arrow has completely exited the visible board, unmount from SVG
  if (!renderData) {
    return null;
  }

  // Theme colors matching reference screenshots:
  // Default: Dark Navy #0B132B
  // Highlight / Hinted / Blocked: Vibrant Coral Red #EF4444
  const strokeColor = isBlocked || isHinted ? '#EF4444' : '#0B132B';

  return (
    <g
      id={`arrow-${arrow.id}`}
      style={{
        pointerEvents: isEscaping ? 'none' : 'auto',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      className={`cursor-pointer transition-opacity duration-100 outline-none focus:outline-none select-none active:opacity-80 ${isBlocked ? 'animate-wiggle' : ''}`}
      onPointerDown={(e) => {
        // Prevent default browser/webview selection outline
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onTap(arrow);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onTap(arrow);
        }
      }}
      aria-label={`Arrow pointing ${arrow.direction} at col ${arrow.x + 1}, row ${arrow.y + 1}`}
      role="button"
      tabIndex={-1}
    >
      {/* Invisible generous touch target hitbox along the path (minimum 44px touch area) */}
      <path
        d={renderData.pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(44, cellSize * 0.75)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={renderData.tip.x}
        cy={renderData.tip.y}
        r={Math.max(22, cellSize * 0.4)}
        fill="transparent"
      />

      {/* Hint glow effect */}
      {isHinted && (
        <>
          <path
            d={renderData.pathD}
            fill="none"
            stroke="#EF4444"
            strokeWidth={track.strokeWidth + 6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
            className="animate-pulse"
          />
          <polygon
            points={renderData.arrowHeadPoints}
            fill="#EF4444"
            opacity="0.35"
            className="animate-pulse"
          />
        </>
      )}

      {/* Main Arrow Stem (dynamically straightens first, then translates off-board) */}
      <path
        d={renderData.pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={track.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-150"
      />

      {/* Triangular Arrowhead (continuously anchored and aligned with stem) */}
      <polygon
        points={renderData.arrowHeadPoints}
        fill={strokeColor}
        stroke={strokeColor}
        strokeWidth={1}
        strokeLinejoin="round"
        className="transition-colors duration-150"
      />
    </g>
  );
};

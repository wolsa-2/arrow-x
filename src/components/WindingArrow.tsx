import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Arrow } from '../game/types';
import {
  buildArrowTrack,
  getSlicedArrowRenderData,
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
  // Pre-calculate polyline track for geometry and path slicing
  const track = useMemo(
    () => buildArrowTrack(arrow, cellSize, boardCols, boardRows),
    [arrow, cellSize, boardCols, boardRows]
  );

  const [animProgress, setAnimProgress] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const onEscapeFinishedRef = useRef(onEscapeFinished);
  onEscapeFinishedRef.current = onEscapeFinished;

  useEffect(() => {
    if (!isEscaping) {
      setAnimProgress(0);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    // Animation started: calculate duration based on travel distance and consistent speed
    // Speed: 9.5 cells per second for snappy, readable puzzle game escape motion
    const speed = Math.max(280, cellSize * 9.5); // px/sec
    const travelDistance = track.totalLength - track.initialArrowLength;
    const durationMs = Math.max(320, Math.min(540, (travelDistance / speed) * 1000));

    let startTime: number | null = null;

    const animate = (time: number) => {
      if (startTime === null) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Frame-rate-independent consistent speed motion along the polyline track
      setAnimProgress(progress);

      if (progress < 1) {
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
  }, [arrow.id, cellSize, isEscaping, track]);

  // Compute sliced path at current progress
  const renderData: SlicedArrowRenderData | null = useMemo(() => {
    if (!isEscaping) {
      return getSlicedArrowRenderData(track, 0);
    }
    return getSlicedArrowRenderData(track, animProgress);
  }, [track, isEscaping, animProgress]);

  // If the arrow has completely exited the visible board, return null
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
      }}
      className={`cursor-pointer transition-colors duration-150 ${isBlocked ? 'animate-wiggle' : ''}`}
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
      tabIndex={0}
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

      {/* Main Arrow Stem (dynamically follows and slices polyline track) */}
      <path
        d={renderData.pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={track.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-150"
      />

      {/* Triangular Arrowhead (leads along path and turns at corners) */}
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

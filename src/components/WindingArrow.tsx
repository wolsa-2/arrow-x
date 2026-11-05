import React, { useEffect, useRef, useMemo } from 'react';
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
  onTap: (arrow: Arrow, clientX?: number, clientY?: number) => void;
  onEscapeFinished?: (arrowId: string) => void;
}

const WindingArrowComponent: React.FC<WindingArrowProps> = ({
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

  // Initial resting render data
  const initialRenderData: SlicedArrowRenderData | null = useMemo(
    () => getArrowRenderData(track, 0),
    [track]
  );

  const groupRef = useRef<SVGGElement>(null);
  const mainPathRef = useRef<SVGPathElement>(null);
  const headPolygonRef = useRef<SVGPolygonElement>(null);
  const hitboxPathRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);
  const glowPolygonRef = useRef<SVGPolygonElement>(null);

  const animFrameRef = useRef<number | null>(null);
  const onEscapeFinishedRef = useRef(onEscapeFinished);
  onEscapeFinishedRef.current = onEscapeFinished;

  useEffect(() => {
    if (!isEscaping) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (groupRef.current) groupRef.current.style.display = '';
      if (initialRenderData) {
        if (mainPathRef.current) mainPathRef.current.setAttribute('d', initialRenderData.pathD);
        if (headPolygonRef.current) headPolygonRef.current.setAttribute('points', initialRenderData.arrowHeadPoints);
        if (hitboxPathRef.current) hitboxPathRef.current.setAttribute('d', initialRenderData.pathD);
      }
      return;
    }

    let startTime: number | null = null;
    const totalMs = track.totalDurationMs;

    const animate = (time: number) => {
      if (startTime === null) startTime = time;
      const elapsed = time - startTime;

      const rd = getArrowRenderData(track, elapsed);
      if (!rd) {
        if (groupRef.current) groupRef.current.style.display = 'none';
        animFrameRef.current = null;
        if (onEscapeFinishedRef.current) {
          onEscapeFinishedRef.current(arrow.id);
        }
        return;
      }

      // Directly update SVG attributes on DOM node - 0 React re-renders, 0 GC pauses, 60 FPS
      if (mainPathRef.current) mainPathRef.current.setAttribute('d', rd.pathD);
      if (headPolygonRef.current) headPolygonRef.current.setAttribute('points', rd.arrowHeadPoints);
      if (hitboxPathRef.current) hitboxPathRef.current.setAttribute('d', rd.pathD);
      if (glowPathRef.current) glowPathRef.current.setAttribute('d', rd.pathD);
      if (glowPolygonRef.current) glowPolygonRef.current.setAttribute('points', rd.arrowHeadPoints);

      if (elapsed < totalMs) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        if (groupRef.current) groupRef.current.style.display = 'none';
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
  }, [arrow.id, isEscaping, track, initialRenderData]);

  if (!initialRenderData) {
    return null;
  }

  // Theme colors matching reference screenshots:
  // Default: Dark Navy #0B132B
  // Highlight / Hinted / Blocked: Vibrant Coral Red #EF4444
  const strokeColor = isBlocked || isHinted ? '#EF4444' : '#0B132B';

  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

  return (
    <g
      ref={groupRef}
      id={`arrow-${arrow.id}`}
      style={{
        pointerEvents: isEscaping ? 'none' : 'auto',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      className={`cursor-pointer pointer-events-auto transition-opacity duration-100 outline-none focus:outline-none select-none active:opacity-80 ${isBlocked ? 'animate-wiggle' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onTapRef.current) {
          onTapRef.current(arrow, e.clientX, e.clientY);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          if (onTapRef.current) {
            onTapRef.current(arrow);
          }
        }
      }}
      aria-label={`Arrow pointing ${arrow.direction} at col ${arrow.x + 1}, row ${arrow.y + 1}`}
      role="button"
      tabIndex={-1}
    >
      {/* Invisible touch target hitbox along the path strictly constrained to cell footprint */}
      <path
        ref={hitboxPathRef}
        d={initialRenderData.pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(16, Math.min(28, cellSize * 0.48))}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'stroke' }}
      />

      {/* Hint glow effect */}
      {isHinted && (
        <>
          <path
            ref={glowPathRef}
            d={initialRenderData.pathD}
            fill="none"
            stroke="#EF4444"
            strokeWidth={track.strokeWidth + 6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.35"
            className="animate-pulse"
          />
          <polygon
            ref={glowPolygonRef}
            points={initialRenderData.arrowHeadPoints}
            fill="#EF4444"
            opacity="0.35"
            className="animate-pulse"
          />
        </>
      )}

      {/* Main Arrow Stem (smooth snake-like slithering off-board) */}
      <path
        ref={mainPathRef}
        d={initialRenderData.pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={track.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-150"
      />

      {/* Triangular Arrowhead (continuously anchored and aligned with stem) */}
      <polygon
        ref={headPolygonRef}
        points={initialRenderData.arrowHeadPoints}
        fill={strokeColor}
        stroke={strokeColor}
        strokeWidth={1}
        strokeLinejoin="round"
        className="transition-colors duration-150"
      />
    </g>
  );
};

export const WindingArrow = React.memo(WindingArrowComponent, (prev, next) => {
  return (
    prev.arrow.id === next.arrow.id &&
    prev.arrow.x === next.arrow.x &&
    prev.arrow.y === next.arrow.y &&
    prev.arrow.direction === next.arrow.direction &&
    prev.cellSize === next.cellSize &&
    prev.boardCols === next.boardCols &&
    prev.boardRows === next.boardRows &&
    prev.isEscaping === next.isEscaping &&
    prev.isBlocked === next.isBlocked &&
    prev.isHinted === next.isHinted &&
    prev.onTap === next.onTap
  );
});

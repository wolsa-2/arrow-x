import { Arrow, Direction } from './types';

export interface Point2D {
  x: number;
  y: number;
}

export interface ArrowTrack {
  arrowId: string;
  direction: Direction;
  dirVec: Point2D;
  headAnchor: Point2D;
  bodyVertices: Point2D[]; // Resting points from tail to head
  strokeWidth: number;
  arrowHeadSize: number;
  isBent: boolean;
  totalLength: number; // Resting body length (arc length from tail to head)
  totalDurationMs: number; // Total escape duration
  exitDistance: number; // Distance traveled from head to off-screen
  // Guide polyline: resting body vertices + forward exit ray
  guideVertices: Point2D[];
  cumulativeDistances: number[]; // Arc lengths along guideVertices
  // Backward compatibility fields
  straightenDurationMs: number;
  exitDurationMs: number;
  initialArrowLength: number;
  vertices: Point2D[];
  segmentLengths?: number[];
  segmentDeltaThetas?: number[];
  backwardAngle?: number;
}

export interface SlicedArrowRenderData {
  pathD: string;
  arrowHeadPoints: string;
  tip: Point2D;
  tangent: Point2D;
  isCompletelyExited: boolean;
}

export type ArrowRenderData = SlicedArrowRenderData;

/**
 * Builds the geometric track and arc-length guide trajectory for an arrow.
 * Preserves the exact multi-turn geometry for snake-like path-following movement.
 */
export function buildArrowTrack(
  arrow: Arrow,
  cellSize: number,
  boardCols: number,
  boardRows: number
): ArrowTrack {
  let dx = 0;
  let dy = 0;
  if (arrow.direction === 'up') dy = -1;
  else if (arrow.direction === 'down') dy = 1;
  else if (arrow.direction === 'left') dx = -1;
  else if (arrow.direction === 'right') dx = 1;

  const strokeWidth = Math.max(5.5, Math.min(8.5, cellSize * 0.13));
  const arrowHeadSize = Math.max(14, Math.min(22, cellSize * 0.34));

  const rawPoints =
    arrow.points && arrow.points.length > 0
      ? arrow.points
      : [{ x: arrow.x, y: arrow.y }];

  const bodyVertices: Point2D[] = [];

  if (rawPoints.length === 1) {
    // Single-node arrow: generate straight stem aligned with direction
    const headX = rawPoints[0].x * cellSize + cellSize / 2;
    const headY = rawPoints[0].y * cellSize + cellSize / 2;
    const tailX = headX - dx * (cellSize * 0.28);
    const tailY = headY - dy * (cellSize * 0.28);
    const baseHeadX = headX + dx * (cellSize * 0.18);
    const baseHeadY = headY + dy * (cellSize * 0.18);

    bodyVertices.push({ x: tailX, y: tailY });
    bodyVertices.push({ x: baseHeadX, y: baseHeadY });
  } else {
    // Multi-segment arrow: rawPoints[0] is tail, rawPoints[N-1] is head
    for (let i = 0; i < rawPoints.length; i++) {
      const px = rawPoints[i].x * cellSize + cellSize / 2;
      const py = rawPoints[i].y * cellSize + cellSize / 2;
      bodyVertices.push({ x: px, y: py });
    }

    const lastP = rawPoints[rawPoints.length - 1];
    const prevP = rawPoints[rawPoints.length - 2];
    const inDx = Math.sign(lastP.x - prevP.x);
    const inDy = Math.sign(lastP.y - prevP.y);

    if (inDx === dx && inDy === dy) {
      // Last segment is already aligned with exit direction; cap cleanly into arrowhead base
      const lastIdx = bodyVertices.length - 1;
      bodyVertices[lastIdx] = {
        x: bodyVertices[lastIdx].x + dx * (strokeWidth * 0.5),
        y: bodyVertices[lastIdx].y + dy * (strokeWidth * 0.5),
      };
    } else {
      // Arrow turns into exit direction at head
      const lastVertex = bodyVertices[bodyVertices.length - 1];
      bodyVertices.push({
        x: lastVertex.x + dx * (cellSize * 0.22),
        y: lastVertex.y + dy * (cellSize * 0.22),
      });
    }
  }

  // Head anchor is the final vertex of the resting body
  const headAnchor = { ...bodyVertices[bodyVertices.length - 1] };

  // Calculate cumulative arc lengths along the resting body and detect bends
  const cumulativeDistances: number[] = [0];
  let totalLength = 0;
  let isBent = false;

  for (let i = 1; i < bodyVertices.length; i++) {
    const segDx = bodyVertices[i].x - bodyVertices[i - 1].x;
    const segDy = bodyVertices[i].y - bodyVertices[i - 1].y;
    const len = Math.hypot(segDx, segDy);
    totalLength += len;
    cumulativeDistances.push(totalLength);

    if (i > 1) {
      const prevDx = bodyVertices[i - 1].x - bodyVertices[i - 2].x;
      const prevDy = bodyVertices[i - 1].y - bodyVertices[i - 2].y;
      if (Math.abs(segDx * prevDy - segDy * prevDx) > 1e-4) {
        isBent = true;
      }
    }
  }

  // Exit distance ensures the entire arrow tail completely exits the game board viewport
  const maxDim = Math.max(boardCols, boardRows) * cellSize;
  const exitDistance = maxDim + totalLength + cellSize * 3;

  // The guide polyline consists of the resting body plus the straight forward exit ray
  const exitVertex: Point2D = {
    x: headAnchor.x + dx * exitDistance,
    y: headAnchor.y + dy * exitDistance,
  };
  const guideVertices: Point2D[] = [...bodyVertices, exitVertex];
  cumulativeDistances.push(totalLength + exitDistance);

  // Total escape duration: responsive and snappy while allowing clear snake traversal
  const totalDurationMs = Math.round(
    Math.max(340, Math.min(440, 320 + totalLength * 0.2))
  );

  return {
    arrowId: arrow.id,
    direction: arrow.direction,
    dirVec: { x: dx, y: dy },
    headAnchor,
    bodyVertices,
    strokeWidth,
    arrowHeadSize,
    isBent,
    totalLength,
    totalDurationMs,
    exitDistance,
    guideVertices,
    cumulativeDistances,
    // Backward compatibility fields
    straightenDurationMs: 0,
    exitDurationMs: totalDurationMs,
    initialArrowLength: totalLength,
    vertices: guideVertices,
  };
}

/**
 * Extracts a continuous sub-curve from a polyline between arc lengths uStart and uEnd.
 * Preserves all intermediate corner vertices between uStart and uEnd.
 * Returns an array of Point2D ordered from uStart to uEnd.
 */
export function slicePolylineByArcLength(
  vertices: Point2D[],
  cumDist: number[],
  uStart: number,
  uEnd: number
): Point2D[] {
  const K = vertices.length - 1;
  const totalLength = cumDist[cumDist.length - 1];

  if (uStart >= totalLength || uEnd <= 0 || uStart >= uEnd) {
    return [];
  }

  const s0 = Math.max(0, uStart);
  const s1 = Math.min(totalLength, uEnd);

  // 1. Locate start segment
  let startSeg = 0;
  while (startSeg < K - 1 && cumDist[startSeg + 1] < s0) {
    startSeg++;
  }
  const seg0Len = cumDist[startSeg + 1] - cumDist[startSeg];
  const t0 = seg0Len > 1e-6 ? (s0 - cumDist[startSeg]) / seg0Len : 0;
  const startPt: Point2D = {
    x: vertices[startSeg].x + (vertices[startSeg + 1].x - vertices[startSeg].x) * t0,
    y: vertices[startSeg].y + (vertices[startSeg + 1].y - vertices[startSeg].y) * t0,
  };

  // 2. Locate end segment
  let endSeg = startSeg;
  while (endSeg < K - 1 && cumDist[endSeg + 1] < s1) {
    endSeg++;
  }
  const seg1Len = cumDist[endSeg + 1] - cumDist[endSeg];
  const t1 = seg1Len > 1e-6 ? (s1 - cumDist[endSeg]) / seg1Len : 0;
  const endPt: Point2D = {
    x: vertices[endSeg].x + (vertices[endSeg + 1].x - vertices[endSeg].x) * t1,
    y: vertices[endSeg].y + (vertices[endSeg + 1].y - vertices[endSeg].y) * t1,
  };

  const result: Point2D[] = [startPt];

  // 3. Add all intermediate polyline vertices strictly between s0 and s1
  for (let j = startSeg + 1; j <= endSeg; j++) {
    const d = cumDist[j];
    if (d > s0 + 0.05 && d < s1 - 0.05) {
      result.push({ x: vertices[j].x, y: vertices[j].y });
    }
  }

  // 4. Add end point if not duplicate of last point
  const last = result[result.length - 1];
  const dLast = Math.hypot(endPt.x - last.x, endPt.y - last.y);
  if (dLast > 0.05) {
    result.push(endPt);
  } else if (result.length === 1) {
    result.push({ x: endPt.x, y: endPt.y });
  }

  return result;
}

/**
 * Computes arrow render data (SVG path and arrowhead polygon) for a given elapsed time in ms.
 * True Snake-like Movement:
 * - Preserves original multi-turn geometry (L, U, S, Z, zigzag).
 * - Arrowhead moves forward along its exit trajectory.
 * - Entire body follows behind the head along the exact track of the arrow.
 * - Every horizontal and vertical turn is followed smoothly and sequentially.
 * - Constant path thickness, rounded corners, and constant arc length.
 * - Returns null only after the entire arrow body has exited the board.
 */
export function getArrowRenderData(
  track: ArrowTrack,
  elapsedMs: number
): SlicedArrowRenderData | null {
  const {
    dirVec,
    headAnchor,
    bodyVertices,
    arrowHeadSize,
    totalLength,
    totalDurationMs,
    exitDistance,
    guideVertices,
    cumulativeDistances,
  } = track;

  // Completely finished and off-screen
  if (elapsedMs >= totalDurationMs) {
    return null;
  }

  const { x: dx, y: dy } = dirVec;
  const perpX = -dy;
  const perpY = dx;

  // Resting state (elapsedMs <= 0 or not yet escaping)
  if (elapsedMs <= 0) {
    let pathD = `M ${bodyVertices[0].x.toFixed(1)} ${bodyVertices[0].y.toFixed(1)}`;
    for (let i = 1; i < bodyVertices.length; i++) {
      pathD += ` L ${bodyVertices[i].x.toFixed(1)} ${bodyVertices[i].y.toFixed(1)}`;
    }

    const tipX = headAnchor.x + dx * arrowHeadSize;
    const tipY = headAnchor.y + dy * arrowHeadSize;
    const baseLeftX = headAnchor.x + perpX * (arrowHeadSize * 0.65);
    const baseLeftY = headAnchor.y + perpY * (arrowHeadSize * 0.65);
    const baseRightX = headAnchor.x - perpX * (arrowHeadSize * 0.65);
    const baseRightY = headAnchor.y - perpY * (arrowHeadSize * 0.65);

    const arrowHeadPoints = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${baseLeftX.toFixed(1)},${baseLeftY.toFixed(1)} ${baseRightX.toFixed(1)},${baseRightY.toFixed(1)}`;

    return {
      pathD,
      arrowHeadPoints,
      tip: { x: tipX, y: tipY },
      tangent: { x: dx, y: dy },
      isCompletelyExited: false,
    };
  }

  // Snake traversal along the guide polyline:
  const p = Math.max(0, Math.min(1, elapsedMs / totalDurationMs));
  // Smooth quadratic ease-in for natural forward slithering acceleration
  const ease = p * (0.35 + 0.65 * p);
  const distanceTraveled = ease * exitDistance;

  // Slicing window:
  // Tail is at distanceTraveled
  // Head is at totalLength + distanceTraveled (preserving constant body length totalLength)
  const uStart = distanceTraveled;
  const uEnd = totalLength + distanceTraveled;

  const slicePoints = slicePolylineByArcLength(
    guideVertices,
    cumulativeDistances,
    uStart,
    uEnd
  );

  // If the entire arrow body has traversed past the guide polyline, exit is complete
  if (slicePoints.length < 2) {
    return null;
  }

  // Build SVG path
  let pathD = `M ${slicePoints[0].x.toFixed(1)} ${slicePoints[0].y.toFixed(1)}`;
  for (let i = 1; i < slicePoints.length; i++) {
    pathD += ` L ${slicePoints[i].x.toFixed(1)} ${slicePoints[i].y.toFixed(1)}`;
  }

  // Arrowhead is anchored to the front tip of the moving snake
  const headPoint = slicePoints[slicePoints.length - 1];

  const tipX = headPoint.x + dx * arrowHeadSize;
  const tipY = headPoint.y + dy * arrowHeadSize;
  const baseLeftX = headPoint.x + perpX * (arrowHeadSize * 0.65);
  const baseLeftY = headPoint.y + perpY * (arrowHeadSize * 0.65);
  const baseRightX = headPoint.x - perpX * (arrowHeadSize * 0.65);
  const baseRightY = headPoint.y - perpY * (arrowHeadSize * 0.65);

  const arrowHeadPoints = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${baseLeftX.toFixed(1)},${baseLeftY.toFixed(1)} ${baseRightX.toFixed(1)},${baseRightY.toFixed(1)}`;

  return {
    pathD,
    arrowHeadPoints,
    tip: { x: tipX, y: tipY },
    tangent: { x: dx, y: dy },
    isCompletelyExited: false,
  };
}

/**
 * Normalizes progress in [0, 1] to totalDurationMs for compatibility.
 */
export function getSlicedArrowRenderData(
  track: ArrowTrack,
  progress: number
): SlicedArrowRenderData | null {
  if (progress >= 1) return null;
  const elapsedMs = Math.max(0, progress * track.totalDurationMs);
  return getArrowRenderData(track, elapsedMs);
}

/**
 * Samples a point and forward tangent along the guide trajectory at distance s from headAnchor.
 */
export function getPointAndTangentAtDistance(
  track: ArrowTrack,
  s: number
): { point: Point2D; tangent: Point2D } {
  const { dirVec, headAnchor } = track;
  return {
    point: {
      x: headAnchor.x + dirVec.x * s,
      y: headAnchor.y + dirVec.y * s,
    },
    tangent: { ...dirVec },
  };
}

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
  totalLength: number;
  straightenDurationMs: number;
  exitDurationMs: number;
  totalDurationMs: number;
  exitDistance: number;
  // Kinematic backward chain from head anchor to tail
  segmentLengths: number[];
  segmentDeltaThetas: number[];
  backwardAngle: number;
  // Backward compatibility fields
  vertices: Point2D[];
  cumulativeDistances: number[];
  initialArrowLength: number;
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
 * Builds geometric and kinematic track data for an arrow.
 * Supports straight, L-shaped, and multi-segment winding arrows.
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

  const rawPoints = arrow.points && arrow.points.length > 0
    ? arrow.points
    : [{ x: arrow.x, y: arrow.y }];

  const bodyVertices: Point2D[] = [];

  if (rawPoints.length === 1) {
    // Single node arrow: synthesize straight stem aligned with direction
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
      const lastIdx = bodyVertices.length - 1;
      bodyVertices[lastIdx] = {
        x: bodyVertices[lastIdx].x + dx * (strokeWidth * 0.5),
        y: bodyVertices[lastIdx].y + dy * (strokeWidth * 0.5),
      };
    } else {
      // Arrow turns at head into exit direction
      const lastVertex = bodyVertices[bodyVertices.length - 1];
      bodyVertices.push({
        x: lastVertex.x + dx * (cellSize * 0.22),
        y: lastVertex.y + dy * (cellSize * 0.22),
      });
    }
  }

  // Head anchor is the final vertex in bodyVertices
  const headAnchor = { ...bodyVertices[bodyVertices.length - 1] };

  // Calculate segment lengths and angles backwards from head anchor to tail
  // Chain: P_0 = headAnchor, P_1 = bodyVertices[N-2], ..., P_{N-1} = tail
  const backwardAngle = Math.atan2(-dy, -dx);
  const segmentLengths: number[] = [];
  const segmentDeltaThetas: number[] = [];
  let totalLength = 0;
  let isBent = false;

  for (let i = bodyVertices.length - 1; i > 0; i--) {
    const current = bodyVertices[i];
    const prev = bodyVertices[i - 1]; // going backwards towards tail
    const segDx = prev.x - current.x;
    const segDy = prev.y - current.y;
    const len = Math.sqrt(segDx * segDx + segDy * segDy);
    segmentLengths.push(len);
    totalLength += len;

    const segAngle = Math.atan2(segDy, segDx);
    let dTheta = (segAngle - backwardAngle) % (2 * Math.PI);
    if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
    if (dTheta < -Math.PI) dTheta += 2 * Math.PI;
    segmentDeltaThetas.push(dTheta);

    if (Math.abs(dTheta) > 0.03) {
      isBent = true;
    }
  }

  // Timings:
  // Phase 1 (straighten): 190ms for bent arrows, 0ms for already-straight arrows
  // Phase 2 (translate): 290ms for clean, snappy escape
  const straightenDurationMs = isBent ? 190 : 0;
  const exitDurationMs = 290;
  const totalDurationMs = straightenDurationMs + exitDurationMs;

  // Exit distance ensures the entire arrow tail completely exits the game board viewport
  const maxDim = Math.max(boardCols, boardRows) * cellSize;
  const exitDistance = maxDim + totalLength + cellSize * 3;

  // Backward compatibility: cumulative distances and vertices
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < bodyVertices.length; i++) {
    const segDx = bodyVertices[i].x - bodyVertices[i - 1].x;
    const segDy = bodyVertices[i].y - bodyVertices[i - 1].y;
    cumulativeDistances.push(cumulativeDistances[i - 1] + Math.sqrt(segDx * segDx + segDy * segDy));
  }
  const exitVertex: Point2D = {
    x: headAnchor.x + dx * exitDistance,
    y: headAnchor.y + dy * exitDistance,
  };
  const vertices: Point2D[] = [...bodyVertices, exitVertex];
  cumulativeDistances.push(cumulativeDistances[cumulativeDistances.length - 1] + exitDistance);

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
    straightenDurationMs,
    exitDurationMs,
    totalDurationMs,
    exitDistance,
    segmentLengths,
    segmentDeltaThetas,
    backwardAngle,
    vertices,
    cumulativeDistances,
    initialArrowLength: totalLength,
  };
}

/**
 * Computes arrow render data (SVG path and arrowhead polygon) for a given elapsed time in ms.
 * Phase 1 (0 to straightenDurationMs): Bent/L-shaped arrow smoothly straightens into exit direction.
 * Phase 2 (straightenDurationMs to totalDurationMs): Straight arrow smoothly translates off board.
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
    isBent,
    totalLength,
    straightenDurationMs,
    exitDurationMs,
    totalDurationMs,
    exitDistance,
    segmentLengths,
    segmentDeltaThetas,
    backwardAngle,
  } = track;

  // Completely finished and off-screen
  if (elapsedMs >= totalDurationMs) {
    return null;
  }

  const { x: dx, y: dy } = dirVec;
  const perpX = -dy;
  const perpY = dx;

  // PHASE 1: Straightening
  if (elapsedMs < straightenDurationMs && isBent) {
    const p1 = Math.max(0, Math.min(1, elapsedMs / straightenDurationMs));
    // Smooth ease-out cubic
    const ease1 = 1 - Math.pow(1 - p1, 3);

    // Unbend segments backwards from head anchor
    const pointsFromHead: Point2D[] = [{ ...headAnchor }];
    let currentPoint = { ...headAnchor };

    for (let i = 0; i < segmentLengths.length; i++) {
      const len = segmentLengths[i];
      const dTheta = segmentDeltaThetas[i];
      const currentAngle = backwardAngle + (1 - ease1) * dTheta;
      const nextPoint: Point2D = {
        x: currentPoint.x + Math.cos(currentAngle) * len,
        y: currentPoint.y + Math.sin(currentAngle) * len,
      };
      pointsFromHead.push(nextPoint);
      currentPoint = nextPoint;
    }

    // Reverse to get points in order: tail -> intermediate -> head
    const orderedPoints = [...pointsFromHead].reverse();

    let pathD = `M ${orderedPoints[0].x.toFixed(1)} ${orderedPoints[0].y.toFixed(1)}`;
    for (let i = 1; i < orderedPoints.length; i++) {
      pathD += ` L ${orderedPoints[i].x.toFixed(1)} ${orderedPoints[i].y.toFixed(1)}`;
    }

    // Head is anchored at headAnchor during Phase 1; direction stays locked to exit direction
    const tipX = headAnchor.x + dx * arrowHeadSize;
    const tipY = headAnchor.y + dy * arrowHeadSize;
    const baseLeftX = headAnchor.x + perpX * (arrowHeadSize * 0.7);
    const baseLeftY = headAnchor.y + perpY * (arrowHeadSize * 0.7);
    const baseRightX = headAnchor.x - perpX * (arrowHeadSize * 0.7);
    const baseRightY = headAnchor.y - perpY * (arrowHeadSize * 0.7);

    const arrowHeadPoints = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${baseLeftX.toFixed(1)},${baseLeftY.toFixed(1)} ${baseRightX.toFixed(1)},${baseRightY.toFixed(1)}`;

    return {
      pathD,
      arrowHeadPoints,
      tip: { x: tipX, y: tipY },
      tangent: { x: dx, y: dy },
      isCompletelyExited: false,
    };
  }

  // Resting state (elapsedMs <= 0 or not yet escaping)
  if (elapsedMs <= 0) {
    let pathD = `M ${bodyVertices[0].x.toFixed(1)} ${bodyVertices[0].y.toFixed(1)}`;
    for (let i = 1; i < bodyVertices.length; i++) {
      pathD += ` L ${bodyVertices[i].x.toFixed(1)} ${bodyVertices[i].y.toFixed(1)}`;
    }

    const tipX = headAnchor.x + dx * arrowHeadSize;
    const tipY = headAnchor.y + dy * arrowHeadSize;
    const baseLeftX = headAnchor.x + perpX * (arrowHeadSize * 0.7);
    const baseLeftY = headAnchor.y + perpY * (arrowHeadSize * 0.7);
    const baseRightX = headAnchor.x - perpX * (arrowHeadSize * 0.7);
    const baseRightY = headAnchor.y - perpY * (arrowHeadSize * 0.7);

    const arrowHeadPoints = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${baseLeftX.toFixed(1)},${baseLeftY.toFixed(1)} ${baseRightX.toFixed(1)},${baseRightY.toFixed(1)}`;

    return {
      pathD,
      arrowHeadPoints,
      tip: { x: tipX, y: tipY },
      tangent: { x: dx, y: dy },
      isCompletelyExited: false,
    };
  }

  // PHASE 2: Translation Exit (smooth forward slide of the straightened arrow)
  const p2 = Math.max(0, Math.min(1, (elapsedMs - straightenDurationMs) / exitDurationMs));
  // Smooth acceleration curve: t * (0.65 + 0.35 * t)
  const ease2 = p2 * (0.65 + 0.35 * p2);
  const offset = ease2 * exitDistance;

  // Head and tail translate together as one rigid straight line
  const headX = headAnchor.x + dx * offset;
  const headY = headAnchor.y + dy * offset;
  const tailX = headAnchor.x + dx * (offset - totalLength);
  const tailY = headAnchor.y + dy * (offset - totalLength);

  const pathD = `M ${tailX.toFixed(1)} ${tailY.toFixed(1)} L ${headX.toFixed(1)} ${headY.toFixed(1)}`;

  const tipX = headX + dx * arrowHeadSize;
  const tipY = headY + dy * arrowHeadSize;
  const baseLeftX = headX + perpX * (arrowHeadSize * 0.7);
  const baseLeftY = headY + perpY * (arrowHeadSize * 0.7);
  const baseRightX = headX - perpX * (arrowHeadSize * 0.7);
  const baseRightY = headY - perpY * (arrowHeadSize * 0.7);

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
 * Backward compatibility helper for testing sampling along track.
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

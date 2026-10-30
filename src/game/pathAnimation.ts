import { Arrow, Direction } from './types';

export interface Point2D {
  x: number;
  y: number;
}

export interface ArrowTrack {
  vertices: Point2D[];
  cumulativeDistances: number[];
  totalLength: number;
  initialArrowLength: number;
  exitDistance: number;
  strokeWidth: number;
  arrowHeadSize: number;
  direction: Direction;
}

export interface SlicedArrowRenderData {
  pathD: string;
  arrowHeadPoints: string;
  tip: Point2D;
  tangent: Point2D;
  isCompletelyExited: boolean;
}

/**
 * Builds the complete continuous polyline track for an arrow:
 * [V_0 (tail), V_1, ..., V_head, V_exit (off-board in exit direction)]
 */
export function buildArrowTrack(
  arrow: Arrow,
  cellSize: number,
  boardCols: number,
  boardRows: number
): ArrowTrack {
  // Arrowhead escape direction vectors
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
    // Single node arrow: synthesize a straight stem aligned with direction
    const headX = rawPoints[0].x * cellSize + cellSize / 2;
    const headY = rawPoints[0].y * cellSize + cellSize / 2;
    const tailX = headX - dx * (cellSize * 0.28);
    const tailY = headY - dy * (cellSize * 0.28);
    const baseHeadX = headX + dx * (cellSize * 0.18);
    const baseHeadY = headY + dy * (cellSize * 0.18);

    bodyVertices.push({ x: tailX, y: tailY });
    bodyVertices.push({ x: baseHeadX, y: baseHeadY });
  } else {
    // Multi-segment winding arrow:
    // rawPoints[0] is tail, rawPoints[N-1] is head
    for (let i = 0; i < rawPoints.length; i++) {
      const px = rawPoints[i].x * cellSize + cellSize / 2;
      const py = rawPoints[i].y * cellSize + cellSize / 2;
      bodyVertices.push({ x: px, y: py });
    }
    // Extend slightly at head base for clean arrow join
    const lastIdx = bodyVertices.length - 1;
    bodyVertices[lastIdx] = {
      x: bodyVertices[lastIdx].x + dx * (strokeWidth * 0.5),
      y: bodyVertices[lastIdx].y + dy * (strokeWidth * 0.5),
    };
  }

  // Calculate exit point far off the board in arrow.direction
  const headVertex = bodyVertices[bodyVertices.length - 1];
  const maxBoardDim = Math.max(boardCols, boardRows) * cellSize;
  // Calculate initial arrow body length
  let initialLen = 0;
  for (let i = 1; i < bodyVertices.length; i++) {
    const segDx = bodyVertices[i].x - bodyVertices[i - 1].x;
    const segDy = bodyVertices[i].y - bodyVertices[i - 1].y;
    initialLen += Math.sqrt(segDx * segDx + segDy * segDy);
  }

  // Ensure exit point allows the entire tail to exit board viewport with generous margin
  const exitDistance = maxBoardDim + initialLen + cellSize * 4;
  const exitVertex: Point2D = {
    x: headVertex.x + dx * exitDistance,
    y: headVertex.y + dy * exitDistance,
  };

  const vertices: Point2D[] = [...bodyVertices, exitVertex];

  // Cumulative arc lengths
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < vertices.length; i++) {
    const segDx = vertices[i].x - vertices[i - 1].x;
    const segDy = vertices[i].y - vertices[i - 1].y;
    const dist = Math.sqrt(segDx * segDx + segDy * segDy);
    cumulativeDistances.push(cumulativeDistances[i - 1] + dist);
  }

  const totalLength = cumulativeDistances[cumulativeDistances.length - 1];
  const headIndex = bodyVertices.length - 1;
  const initialArrowLength = cumulativeDistances[headIndex];

  return {
    vertices,
    cumulativeDistances,
    totalLength,
    initialArrowLength,
    exitDistance,
    strokeWidth,
    arrowHeadSize,
    direction: arrow.direction,
  };
}

/**
 * Samples a 2D position and unit tangent vector at distance s along the track.
 */
export function getPointAndTangentAtDistance(
  track: ArrowTrack,
  s: number
): { point: Point2D; tangent: Point2D } {
  const { vertices, cumulativeDistances, totalLength } = track;
  const clampedS = Math.max(0, Math.min(totalLength, s));

  // Find segment
  for (let i = 0; i < cumulativeDistances.length - 1; i++) {
    const s0 = cumulativeDistances[i];
    const s1 = cumulativeDistances[i + 1];

    if (clampedS <= s1 || i === cumulativeDistances.length - 2) {
      const segLen = s1 - s0;
      if (segLen < 0.0001) {
        return {
          point: { ...vertices[i] },
          tangent: { x: 1, y: 0 },
        };
      }
      const alpha = (clampedS - s0) / segLen;
      const vx = vertices[i + 1].x - vertices[i].x;
      const vy = vertices[i + 1].y - vertices[i].y;
      const point: Point2D = {
        x: vertices[i].x + alpha * vx,
        y: vertices[i].y + alpha * vy,
      };
      const tangent: Point2D = {
        x: vx / segLen,
        y: vy / segLen,
      };
      return { point, tangent };
    }
  }

  // Fallback to end
  const last = vertices[vertices.length - 1];
  return { point: { ...last }, tangent: { x: 0, y: -1 } };
}

/**
 * Slices the arrow polyline and computes arrowhead geometry for an animation progress in [0, 1].
 * Progress 0 = rest position.
 * Progress 1 = tail has completely exited the visible board.
 */
export function getSlicedArrowRenderData(
  track: ArrowTrack,
  progress: number
): SlicedArrowRenderData | null {
  const { vertices, cumulativeDistances, initialArrowLength, totalLength, arrowHeadSize } = track;

  if (progress >= 1) {
    return null; // completely exited and hidden
  }

  // Distance travel needed for tail to pass beyond the exit point
  // When d_advance = travelDist, d_tail = totalLength - initialArrowLength
  const travelDist = totalLength - initialArrowLength;
  const clampedP = Math.max(0, Math.min(1, progress));
  const dAdvance = clampedP * travelDist;

  const dTail = dAdvance;
  const dHead = initialArrowLength + dAdvance;

  // Tail sample
  const tailSample = getPointAndTangentAtDistance(track, dTail);
  // Head sample
  const headSample = getPointAndTangentAtDistance(track, dHead);

  // Find all track vertices strictly between dTail and dHead
  const intermediateVertices: Point2D[] = [];
  for (let i = 0; i < cumulativeDistances.length; i++) {
    const s = cumulativeDistances[i];
    if (s > dTail + 0.1 && s < dHead - 0.1) {
      intermediateVertices.push(vertices[i]);
    }
  }

  // Combine into polyline points
  const polylinePoints: Point2D[] = [
    tailSample.point,
    ...intermediateVertices,
    headSample.point,
  ];

  // Build SVG path string: M p0.x p0.y L p1.x p1.y ...
  let pathD = `M ${polylinePoints[0].x.toFixed(1)} ${polylinePoints[0].y.toFixed(1)}`;
  for (let i = 1; i < polylinePoints.length; i++) {
    pathD += ` L ${polylinePoints[i].x.toFixed(1)} ${polylinePoints[i].y.toFixed(1)}`;
  }

  // Calculate triangular arrowhead polygon:
  // Base is at headSample.point, tip extends forward along headSample.tangent
  const tauX = headSample.tangent.x;
  const tauY = headSample.tangent.y;
  const perpX = -tauY;
  const perpY = tauX;

  const baseCenter = headSample.point;
  const tipX = baseCenter.x + tauX * arrowHeadSize;
  const tipY = baseCenter.y + tauY * arrowHeadSize;

  const baseLeftX = baseCenter.x + perpX * (arrowHeadSize * 0.7);
  const baseLeftY = baseCenter.y + perpY * (arrowHeadSize * 0.7);

  const baseRightX = baseCenter.x - perpX * (arrowHeadSize * 0.7);
  const baseRightY = baseCenter.y - perpY * (arrowHeadSize * 0.7);

  const arrowHeadPoints = `${tipX.toFixed(1)},${tipY.toFixed(1)} ${baseLeftX.toFixed(1)},${baseLeftY.toFixed(1)} ${baseRightX.toFixed(1)},${baseRightY.toFixed(1)}`;

  return {
    pathD,
    arrowHeadPoints,
    tip: { x: tipX, y: tipY },
    tangent: headSample.tangent,
    isCompletelyExited: false,
  };
}

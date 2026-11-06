import { Arrow, Direction, Obstacle } from './types';

export interface BlockerInfo {
  x: number;
  y: number;
  id: string;
  type: 'arrow' | 'obstacle';
}

export interface EscapeCheckResult {
  canEscape: boolean;
  blocker?: BlockerInfo;
  escapeTrajectory: Array<{ x: number; y: number }>;
}

/**
 * Returns all cells occupied by an arrow on the grid.
 * If length is > 1, it extends backwards from the head (x,y) or footprint.
 */
export function getOccupiedCells(arrow: Arrow): Array<{ x: number; y: number }> {
  if (arrow.points && arrow.points.length > 0) {
    return [...arrow.points];
  }

  const cells: Array<{ x: number; y: number }> = [];
  const len = arrow.length || 1;

  for (let i = 0; i < len; i++) {
    let cx = arrow.x;
    let cy = arrow.y;

    if (arrow.direction === 'up') cy = arrow.y + i;
    else if (arrow.direction === 'down') cy = arrow.y - i;
    else if (arrow.direction === 'left') cx = arrow.x + i;
    else if (arrow.direction === 'right') cx = arrow.x - i;

    cells.push({ x: cx, y: cy });
  }

  return cells;
}

/**
 * Checks whether an arrow can escape off the board without hitting any other arrow or obstacle.
 */
export function canArrowEscape(
  arrow: Arrow,
  activeArrows: Arrow[],
  obstacles: Obstacle[] = [],
  cols: number,
  rows: number
): EscapeCheckResult {
  const trajectory: Array<{ x: number; y: number }> = [];

  // Determine starting ray cell (just in front of the arrow head)
  const headPos =
    arrow.points && arrow.points.length > 0
      ? arrow.points[arrow.points.length - 1]
      : { x: arrow.x, y: arrow.y };
  let curX = headPos.x;
  let curY = headPos.y;

  let dx = 0;
  let dy = 0;

  if (arrow.direction === 'up') dy = -1;
  else if (arrow.direction === 'down') dy = 1;
  else if (arrow.direction === 'left') dx = -1;
  else if (arrow.direction === 'right') dx = 1;

  // Build occupancy lookup for quick testing
  const obstacleMap = new Map<string, Obstacle>();
  for (const obs of obstacles) {
    obstacleMap.set(`${obs.x},${obs.y}`, obs);
  }

  const arrowCellMap = new Map<string, { arrowId: string }>();
  for (const other of activeArrows) {
    if (other.id === arrow.id) continue;
    const cells = getOccupiedCells(other);
    for (const cell of cells) {
      arrowCellMap.set(`${cell.x},${cell.y}`, { arrowId: other.id });
    }
  }

  // Walk step by step toward boundary
  let stepX = curX + dx;
  let stepY = curY + dy;

  while (stepX >= 0 && stepX < cols && stepY >= 0 && stepY < rows) {
    trajectory.push({ x: stepX, y: stepY });

    const key = `${stepX},${stepY}`;

    // Check obstacle
    if (obstacleMap.has(key)) {
      const obs = obstacleMap.get(key)!;
      return {
        canEscape: false,
        blocker: { x: stepX, y: stepY, id: obs.id, type: 'obstacle' },
        escapeTrajectory: trajectory,
      };
    }

    // Check other arrows
    if (arrowCellMap.has(key)) {
      const item = arrowCellMap.get(key)!;
      return {
        canEscape: false,
        blocker: { x: stepX, y: stepY, id: item.arrowId, type: 'arrow' },
        escapeTrajectory: trajectory,
      };
    }

    stepX += dx;
    stepY += dy;
  }

  // Also include the escape cell outside the board for smooth exit
  trajectory.push({ x: stepX, y: stepY });

  return {
    canEscape: true,
    escapeTrajectory: trajectory,
  };
}

/**
 * Returns list of arrows that can currently escape off the board.
 */
export function findEscapableArrows(
  activeArrows: Arrow[],
  obstacles: Obstacle[] = [],
  cols: number,
  rows: number
): Arrow[] {
  return activeArrows.filter((arrow) => {
    return canArrowEscape(arrow, activeArrows, obstacles, cols, rows).canEscape;
  });
}

/**
 * Calculates 1-3 stars rating based on moves taken versus par.
 */
export function calculateStars(movesTaken: number, parMoves: number): number {
  if (movesTaken <= parMoves) return 3;
  if (movesTaken <= parMoves + 2) return 2;
  return 1;
}

/**
 * Resolves the exact arrow selected at a pixel coordinate on the game board.
 * 1. Maps (clickX, clickY) directly to grid cell (col, row).
 *    If an active arrow occupies that cell, it is returned with 100% precision.
 * 2. If the click fell slightly into the cell margin or empty boundary,
 *    a proximity check finds the closest arrow's cell center within a tight threshold.
 */
export function findArrowAtBoardCoord(
  arrows: Arrow[],
  clickX: number,
  clickY: number,
  cellSize: number,
  cols: number,
  rows: number
): Arrow | null {
  if (cellSize <= 0 || arrows.length === 0) return null;

  const col = Math.floor(clickX / cellSize);
  const row = Math.floor(clickY / cellSize);

  // 1. Direct grid cell occupancy check (100% deterministic)
  if (col >= 0 && col < cols && row >= 0 && row < rows) {
    for (const arrow of arrows) {
      const cells = getOccupiedCells(arrow);
      if (cells.some((c) => c.x === col && c.y === row)) {
        return arrow;
      }
    }
  }

  // 2. Edge / boundary arrowhead tap check (e.g. tapping arrowhead tip pointing right at boundary)
  for (const arrow of arrows) {
    const headPos =
      arrow.points && arrow.points.length > 0
        ? arrow.points[arrow.points.length - 1]
        : { x: arrow.x, y: arrow.y };

    let isPointingAtTap = false;
    if (arrow.direction === 'right' && headPos.x === cols - 1 && col >= cols && row === headPos.y) {
      isPointingAtTap = true;
    } else if (arrow.direction === 'left' && headPos.x === 0 && col < 0 && row === headPos.y) {
      isPointingAtTap = true;
    } else if (arrow.direction === 'down' && headPos.y === rows - 1 && row >= rows && col === headPos.x) {
      isPointingAtTap = true;
    } else if (arrow.direction === 'up' && headPos.y === 0 && row < 0 && col === headPos.x) {
      isPointingAtTap = true;
    }

    if (isPointingAtTap) {
      const headCenterX = (headPos.x + 0.5) * cellSize;
      const headCenterY = (headPos.y + 0.5) * cellSize;
      if (Math.hypot(clickX - headCenterX, clickY - headCenterY) < cellSize * 1.1) {
        return arrow;
      }
    }
  }

  // 3. Proximity check for near-miss taps within 0.75 * cellSize of an occupied cell center
  let closestArrow: Arrow | null = null;
  let minDistance = cellSize * 0.75;

  for (const arrow of arrows) {
    const cells = getOccupiedCells(arrow);
    for (const cell of cells) {
      const centerX = (cell.x + 0.5) * cellSize;
      const centerY = (cell.y + 0.5) * cellSize;
      const dist = Math.hypot(clickX - centerX, clickY - centerY);
      if (dist < minDistance) {
        minDistance = dist;
        closestArrow = arrow;
      }
    }
  }

  return closestArrow;
}


import { ArrowPattern, Direction } from './types';

export const ALL_ARROW_PATTERNS: ArrowPattern[] = [
  'straight',
  'l_shape',
  'reverse_l_shape',
  'u_shape',
  'reverse_u_shape',
  's_shape',
  'z_shape',
  'double_bend',
  'triple_bend',
  'long_zigzag',
];

interface Point {
  x: number;
  y: number;
}

/**
 * Generates an orthogonal grid path for an arrow following one of the 10 patterns.
 * Starts from the head (x,y) and grows backwards into the grid.
 * Returns points ordered from TAIL to HEAD (points[0] is tail, points[points.length - 1] is head).
 * Guarantees length is between minLength (3) and maxLength (13), with no self-intersections
 * and no collisions with already occupied cells.
 */
export function generatePatternPoints(
  pattern: ArrowPattern,
  headX: number,
  headY: number,
  direction: Direction,
  targetLength: number,
  cols: number,
  rows: number,
  occupied: Set<string>,
  rng: () => number = Math.random
): Point[] | null {
  const clampedTarget = Math.max(3, Math.min(13, targetLength));

  // Forward unit vector
  let dx = 0;
  let dy = 0;
  if (direction === 'up') dy = -1;
  else if (direction === 'down') dy = 1;
  else if (direction === 'left') dx = -1;
  else if (direction === 'right') dx = 1;

  // Backward unit vector (from head into tail)
  const bx = -dx;
  const by = -dy;

  // Perpendicular unit vectors (relative to direction)
  // pLeft: 90 deg counter-clockwise
  // pRight: 90 deg clockwise
  const pLeft = { x: dy, y: -dx };
  const pRight = { x: -dy, y: dx };

  const head: Point = { x: headX, y: headY };
  const headKey = `${head.x},${head.y}`;
  if (occupied.has(headKey)) return null;

  const pointsFromHead: Point[] = [head];
  const localSet = new Set<string>([headKey]);

  // Helper to walk a number of steps in a specific direction vector
  const walk = (stepVec: Point, maxSteps: number, minSteps: number = 1): boolean => {
    let stepsTaken = 0;
    let curr = pointsFromHead[pointsFromHead.length - 1];

    for (let s = 0; s < maxSteps; s++) {
      if (pointsFromHead.length >= clampedTarget) break;

      const nx = curr.x + stepVec.x;
      const ny = curr.y + stepVec.y;
      const nKey = `${nx},${ny}`;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) break;
      if (occupied.has(nKey) || localSet.has(nKey)) break;

      const nextPt = { x: nx, y: ny };
      pointsFromHead.push(nextPt);
      localSet.add(nKey);
      curr = nextPt;
      stepsTaken++;
    }

    return stepsTaken >= minSteps;
  };

  let success = false;

  switch (pattern) {
    case 'straight': {
      // 1. Straight Arrow: linear stem backwards from head
      success = walk({ x: bx, y: by }, clampedTarget - 1, 2);
      break;
    }

    case 'l_shape': {
      // 2. L-Shape: backward stem + single 90-degree left turn
      const leg1Target = Math.max(2, Math.floor(clampedTarget * 0.5));
      const leg2Target = Math.max(1, clampedTarget - 1 - leg1Target);
      if (walk({ x: bx, y: by }, leg1Target, 1)) {
        if (walk(pLeft, leg2Target, 1)) {
          success = true;
        }
      }
      break;
    }

    case 'reverse_l_shape': {
      // 3. Reverse L-Shape: backward stem + single 90-degree right turn
      const leg1Target = Math.max(2, Math.floor(clampedTarget * 0.5));
      const leg2Target = Math.max(1, clampedTarget - 1 - leg1Target);
      if (walk({ x: bx, y: by }, leg1Target, 1)) {
        if (walk(pRight, leg2Target, 1)) {
          success = true;
        }
      }
      break;
    }

    case 'u_shape': {
      // 4. U-Shape: backward stem + left turn + return leg parallel to forward direction
      const leg1Target = Math.max(2, Math.floor((clampedTarget - 1) * 0.38));
      const baseTarget = Math.max(1, Math.min(2, Math.floor((clampedTarget - 1) * 0.24)));
      const leg3Target = Math.max(1, clampedTarget - 1 - leg1Target - baseTarget);

      if (walk({ x: bx, y: by }, leg1Target, 1)) {
        if (walk(pLeft, baseTarget, 1)) {
          if (walk({ x: -bx, y: -by }, leg3Target, 1)) {
            success = true;
          }
        }
      }
      break;
    }

    case 'reverse_u_shape': {
      // 5. Reverse U-Shape: backward stem + right turn + return leg
      const leg1Target = Math.max(2, Math.floor((clampedTarget - 1) * 0.38));
      const baseTarget = Math.max(1, Math.min(2, Math.floor((clampedTarget - 1) * 0.24)));
      const leg3Target = Math.max(1, clampedTarget - 1 - leg1Target - baseTarget);

      if (walk({ x: bx, y: by }, leg1Target, 1)) {
        if (walk(pRight, baseTarget, 1)) {
          if (walk({ x: -bx, y: -by }, leg3Target, 1)) {
            success = true;
          }
        }
      }
      break;
    }

    case 's_shape': {
      // 6. S-Shape: backward step + left cross + backward step
      const leg1 = Math.max(1, Math.floor((clampedTarget - 1) * 0.34));
      const leg2 = Math.max(1, Math.floor((clampedTarget - 1) * 0.33));
      const leg3 = Math.max(1, clampedTarget - 1 - leg1 - leg2);

      if (walk({ x: bx, y: by }, leg1, 1)) {
        if (walk(pLeft, leg2, 1)) {
          if (walk({ x: bx, y: by }, leg3, 1)) {
            success = true;
          }
        }
      }
      break;
    }

    case 'z_shape': {
      // 7. Z-Shape: backward step + right cross + backward step
      const leg1 = Math.max(1, Math.floor((clampedTarget - 1) * 0.34));
      const leg2 = Math.max(1, Math.floor((clampedTarget - 1) * 0.33));
      const leg3 = Math.max(1, clampedTarget - 1 - leg1 - leg2);

      if (walk({ x: bx, y: by }, leg1, 1)) {
        if (walk(pRight, leg2, 1)) {
          if (walk({ x: bx, y: by }, leg3, 1)) {
            success = true;
          }
        }
      }
      break;
    }

    case 'double_bend': {
      // 8. Double Bend: stepped bends traversing grid corridors
      const perp = rng() > 0.5 ? pLeft : pRight;
      const leg1 = Math.max(1, Math.floor((clampedTarget - 1) * 0.28));
      const leg2 = Math.max(1, Math.floor((clampedTarget - 1) * 0.28));
      const leg3 = Math.max(1, Math.floor((clampedTarget - 1) * 0.24));
      const leg4 = Math.max(1, clampedTarget - 1 - leg1 - leg2 - leg3);

      if (walk({ x: bx, y: by }, leg1, 1)) {
        if (walk(perp, leg2, 1)) {
          if (walk({ x: bx, y: by }, leg3, 1)) {
            if (walk(perp, leg4, 1)) {
              success = true;
            }
          }
        }
      }
      break;
    }

    case 'triple_bend': {
      // 9. Triple Bend: 3 alternating orthogonal bends
      const legLen = Math.max(1, Math.floor((clampedTarget - 1) / 4));
      if (walk({ x: bx, y: by }, legLen, 1)) {
        if (walk(pLeft, legLen, 1)) {
          if (walk({ x: bx, y: by }, legLen, 1)) {
            if (walk(pRight, legLen, 1)) {
              success = true;
            }
          }
        }
      }
      break;
    }

    case 'long_zigzag': {
      // 10. Long Zigzag: alternating multi-bend snake path
      let turnLeft = true;
      let iterations = 0;
      let progressed = true;

      while (pointsFromHead.length < clampedTarget && iterations < 8 && progressed) {
        iterations++;
        // 1 step in backward direction
        const step1 = walk({ x: bx, y: by }, 1, 0);
        if (pointsFromHead.length >= clampedTarget) break;

        // 1-2 steps perpendicular
        const perp = turnLeft ? pLeft : pRight;
        const step2 = walk(perp, rng() > 0.6 ? 2 : 1, 1);
        turnLeft = !turnLeft;
        progressed = step1 || step2;
      }

      success = pointsFromHead.length >= 3;
      break;
    }
  }

  // Minimum length check (must be at least 3 dots)
  if (!success || pointsFromHead.length < 3) {
    return null;
  }

  // Reverse points so points[0] is TAIL and points[points.length - 1] is HEAD
  const finalPoints = [...pointsFromHead].reverse();
  return finalPoints;
}

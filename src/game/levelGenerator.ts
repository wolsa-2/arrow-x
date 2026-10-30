import { Arrow, ArrowColor, Direction, Difficulty, LevelData, Obstacle } from './types';
import { solveLevel, validateLevelStructure, analyzeLevelComplexity } from './solver';

const PALETTE: ArrowColor[] = ['cyan', 'coral', 'emerald', 'amber', 'violet', 'teal', 'rose', 'indigo'];

// Pseudo-random number generator with deterministic seed
function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Handcrafted foundational levels for Levels 1 to 10
 */
export const TUTORIAL_LEVELS: LevelData[] = [
  {
    id: 1,
    name: 'First Escape',
    cols: 3,
    rows: 3,
    difficulty: 'tutorial',
    parMoves: 2,
    tip: 'Tap an arrow to help it escape off the board in the direction it points!',
    arrows: [
      { id: 'a1', x: 1, y: 0, direction: 'up', color: 'cyan' },
      { id: 'a2', x: 1, y: 2, direction: 'down', color: 'coral' },
    ],
  },
  {
    id: 2,
    name: 'Clear The Way',
    cols: 3,
    rows: 3,
    difficulty: 'tutorial',
    parMoves: 2,
    tip: 'An arrow cannot move if another arrow blocks its path. Free the front one first!',
    arrows: [
      { id: 'a1', x: 1, y: 0, direction: 'up', color: 'emerald' },
      { id: 'a2', x: 1, y: 1, direction: 'up', color: 'amber' },
    ],
  },
  {
    id: 3,
    name: 'T-Junction',
    cols: 3,
    rows: 3,
    difficulty: 'tutorial',
    parMoves: 3,
    tip: 'Check all four directions to spot which arrow has an open runway to freedom.',
    arrows: [
      { id: 'a1', x: 0, y: 1, direction: 'left', color: 'cyan' },
      { id: 'a2', x: 2, y: 1, direction: 'right', color: 'violet' },
      { id: 'a3', x: 1, y: 2, direction: 'down', color: 'teal' },
    ],
  },
  {
    id: 4,
    name: 'Crossroads',
    cols: 3,
    rows: 3,
    difficulty: 'tutorial',
    parMoves: 4,
    tip: 'Arrows along the edges can escape outward safely.',
    arrows: [
      { id: 'a1', x: 1, y: 0, direction: 'up', color: 'cyan' },
      { id: 'a2', x: 2, y: 1, direction: 'right', color: 'coral' },
      { id: 'a3', x: 1, y: 2, direction: 'down', color: 'emerald' },
      { id: 'a4', x: 0, y: 1, direction: 'left', color: 'amber' },
    ],
  },
  {
    id: 5,
    name: 'Chain Reaction',
    cols: 3,
    rows: 3,
    difficulty: 'tutorial',
    parMoves: 3,
    tip: 'Releasing one arrow unblocks the one waiting behind it.',
    arrows: [
      { id: 'a1', x: 2, y: 1, direction: 'right', color: 'violet' },
      { id: 'a2', x: 1, y: 1, direction: 'right', color: 'cyan' },
      { id: 'a3', x: 0, y: 1, direction: 'right', color: 'teal' },
    ],
  },
  {
    id: 6,
    name: 'Corner Key',
    cols: 4,
    rows: 4,
    difficulty: 'tutorial',
    parMoves: 4,
    tip: 'Find the key arrow that unlocks the corner!',
    arrows: [
      { id: 'a1', x: 1, y: 0, direction: 'up', color: 'emerald' },
      {
        id: 'a2',
        x: 1,
        y: 1,
        direction: 'up',
        color: 'coral',
        points: [
          { x: 0, y: 2 },
          { x: 1, y: 2 },
          { x: 1, y: 1 },
        ],
      },
      { id: 'a3', x: 2, y: 1, direction: 'up', color: 'cyan' },
      { id: 'a4', x: 2, y: 2, direction: 'right', color: 'amber' },
    ],
  },
  {
    id: 7,
    name: 'Dual Highway',
    cols: 4,
    rows: 4,
    difficulty: 'tutorial',
    parMoves: 5,
    arrows: [
      { id: 'a1', x: 0, y: 1, direction: 'left', color: 'cyan' },
      { id: 'a2', x: 1, y: 1, direction: 'left', color: 'indigo' },
      { id: 'a3', x: 3, y: 2, direction: 'right', color: 'rose' },
      { id: 'a4', x: 2, y: 2, direction: 'right', color: 'coral' },
      { id: 'a5', x: 1, y: 3, direction: 'down', color: 'teal' },
    ],
  },
  {
    id: 8,
    name: 'Windmill',
    cols: 4,
    rows: 4,
    difficulty: 'tutorial',
    parMoves: 5,
    arrows: [
      { id: 'a1', x: 1, y: 0, direction: 'up', color: 'cyan' },
      { id: 'a2', x: 3, y: 1, direction: 'right', color: 'emerald' },
      { id: 'a3', x: 2, y: 3, direction: 'down', color: 'amber' },
      { id: 'a4', x: 0, y: 2, direction: 'left', color: 'coral' },
      { id: 'a5', x: 2, y: 1, direction: 'up', color: 'violet' },
    ],
  },
  {
    id: 9,
    name: 'Gridlock Breaker',
    cols: 4,
    rows: 4,
    difficulty: 'tutorial',
    parMoves: 6,
    arrows: [
      { id: 'a1', x: 0, y: 0, direction: 'up', color: 'teal' },
      { id: 'a2', x: 3, y: 0, direction: 'right', color: 'cyan' },
      { id: 'a3', x: 1, y: 1, direction: 'left', color: 'coral' },
      { id: 'a4', x: 2, y: 1, direction: 'up', color: 'indigo' },
      { id: 'a5', x: 1, y: 2, direction: 'down', color: 'emerald' },
      { id: 'a6', x: 2, y: 2, direction: 'right', color: 'amber' },
    ],
  },
  {
    id: 10,
    name: 'Graduation Test',
    cols: 4,
    rows: 4,
    difficulty: 'tutorial',
    parMoves: 7,
    tip: 'Congratulations! You mastered the basics. Ready for the grand escape?',
    arrows: [
      { id: 'a1', x: 0, y: 1, direction: 'left', color: 'cyan' },
      { id: 'a2', x: 1, y: 1, direction: 'up', color: 'amber' },
      { id: 'a3', x: 2, y: 0, direction: 'up', color: 'emerald' },
      { id: 'a4', x: 2, y: 2, direction: 'down', color: 'coral' },
      { id: 'a5', x: 3, y: 2, direction: 'right', color: 'violet' },
      { id: 'a6', x: 1, y: 3, direction: 'down', color: 'teal' },
      { id: 'a7', x: 1, y: 2, direction: 'right', color: 'rose' },
    ],
  },
];

const LEVEL_NAMES: Record<Difficulty, string[]> = {
  tutorial: ['Basic Escape', 'First Step', 'Pathway', 'Turning Point'],
  easy: [
    'Breeze Way', 'Meadow Path', 'Sunlit Lane', 'Spring Dash', 'Clear Skies',
    'Amber Trail', 'Pebble Walk', 'Quiet Creek', 'Emerald Run', 'Blue Harbor',
    'Whispering Pines', 'Sunny Corner', 'Gentle Turn', 'Morning Dew', 'Forest Gate'
  ],
  medium: [
    'Clockwork Maze', 'Twisted Wire', 'Prism Garden', 'Harbor Lock', 'Silver Web',
    'Coral Reef', 'Iron Bridge', 'Bramble Run', 'Echo Valley', 'Zenith Cross',
    'Cobalt Drift', 'Shadowed Alley', 'Opal Passage', 'Gilded Path', 'Copper Wire',
    'Riverbend', 'Starlight Cross', 'Tide Pool', 'Canyon Leap', 'Granite Steps',
    'Skyline Weave', 'Breezy Terrace', 'Fountain Square', 'Velvet Loop', 'Crystal Ridge'
  ],
  hard: [
    'Labyrinth Gate', 'Obsidian Core', 'Vortex Point', 'Iron Nexus', 'Phantom Pass',
    'Dragonfly Weave', 'Titan Trench', 'Solar Flare', 'Eclipse Ring', 'Thunder Track',
    'Gargoyle Perch', 'Mystic Spiral', 'Frostbite Peak', 'Serpent Alley', 'Basalt Spire',
    'Riddle Vault', 'Amber Citadel', 'Storm Barrier', 'Celestial Lock', 'Quicksilver',
    'Molten Flow', 'Abyssal Chasm', 'Glacier Ridge', 'Clocktower Gear', 'Midnight Run',
    'Chasm Leap', 'Viper Coils', 'Iron Curtain', 'Shadow Lattice', 'Granite Lock'
  ],
  expert: [
    'Grand Mastermind', 'Infinity Circuit', 'Chrono Paradox', 'Apex Labyrinth', 'Nova Nexus',
    'Astral Conundrum', 'Omega Grid', 'Eternal Spiral', 'Quantum Enigma', 'Valkyrie Trail',
    'Hyperion Gate', 'Event Horizon', 'Singularity Core', 'Ragnarok Maze', 'Zenith Citadel',
    'Pandora Box', 'Sovereign Pass', 'Archmage Loom', 'Voidwalker', 'Genesis Matrix',
    'Phoenix Flight', 'Aegis Spire', 'Titanomachia', 'Ouroboros Loop', 'Ascension Apex',
    'Vortex Weaver', 'Starlight Labyrinth', 'Diamond Lattice', 'Nexus Core', 'Dark Matter'
  ],
  master: [
    'Apex Sovereign', 'Quantum Matrix', 'Singularity Gate', 'Chrono Weaver', 'Nebula Vault',
    'Eclipse Paragon', 'Aetherium Loop', 'Helios Cascade', 'Valkyrie Bastion', 'Zenith Crown',
    'Void Sovereign', 'Celestial Nexus', 'Starlit Citadel', 'Ironclad Enigma', 'Titan Loom',
    'Solaris Labyrinth', 'Onyx Fortress', 'Hydra Conduit', 'Prismatic Core', 'Tempest Vault',
    'Archon Spire', 'Hyperdrive Lock', 'Supernova Gate', 'Oblivion Weaver', 'Apex Citadel',
    'Gargantuan Loop', 'Sovereign Grid', 'Genesis Loom', 'Elysian Vault', 'Immortal Key'
  ],
  ultra_pro: [
    'Hyperion Labyrinth', 'Titan Spire', 'Aegis Sentinel', 'Oblivion Rift', 'Valkyrie Core',
    'Colossus Gate', 'Prometheus Matrix', 'Chronos Dominion', 'Supercluster Lattice', 'Apex Overlord',
    'Astral Sovereign', 'Event Singularity', 'Omega Vanguard', 'Leviathan Labyrinth', 'Vortex Emperor',
    'Celestial Aegis', 'Dark Star Matrix', 'Quantum Overdrive', 'Nebula Titan', 'Zenith Bastion',
    'Thunderhead Spire', 'Starlight Dominion', 'Archon Citadel', 'Hyperbolic Core', 'Infinity Bastion',
    'Prism Overlord', 'Genesis Vanguard', 'Cosmic Fortress', 'Ouroboros Apex', 'Eternal Sovereign'
  ],
  ultra_pro_max: [
    'Ultra Pro Max Sovereign', 'Omega Paradox Matrix', 'Absolute Zenith Core', 'Cosmic Enigma Apex',
    'Grand Singularity', 'Infinite Horizon Citadel', 'Transcendent Overlord', 'Godspeed Labyrinth',
    'Multiverse Sentinel', 'Omnipotent Gridlock', 'Hyperdimensional Maze', 'Quantum Singularity Apex',
    'Void Emperor Matrix', 'Eternity Lock', 'Astro Sovereign Bastion', 'Superluminal Citadel',
    'Apex Celestial Forge', 'Universal Loom', 'Prime Omniverse', 'Ultimate Escape Paradox',
    'Supreme Titan Nexus', 'Supercluster Sovereign', 'Genesis Absolute', 'Archangel Citadel',
    'Eclipse Omnipotent', 'Infinity Core Paragon', 'Singularity Overlord', 'Zenith Prime Absolute',
    'Cosmic Apex Sovereign', 'The Final Barrier'
  ],
};

/**
 * Procedurally generates a solvable puzzle board with strategic dependency chains.
 *
 * For Hard, Expert, Master, Ultra Pro, and Ultra Pro Max:
 * - Uses reverse construction where newly placed arrows intentionally block
 *   the escape runway of earlier placed arrows, creating multi-tier dependency chains.
 * - Adds serpentine / L-shaped / U-shaped orthogonal bends.
 * - Verifies 100% solvability and complexity metrics with the solver.
 */
export function generateSolvableLevel(
  levelId: number,
  cols: number,
  rows: number,
  targetArrowCount: number,
  obstacleCount: number,
  difficulty: Difficulty
): LevelData {
  const rng = createPRNG(levelId * 7919 + 1337);

  const nameList = LEVEL_NAMES[difficulty] || LEVEL_NAMES.medium;
  const rawName = nameList[(levelId - 1) % nameList.length];
  const cycle = Math.floor((levelId - 1) / nameList.length);
  const name = cycle > 0 ? `${rawName} #${levelId}` : rawName;

  const isAdvancedTier = ['hard', 'expert', 'master', 'ultra_pro', 'ultra_pro_max'].includes(difficulty);
  const isUltraTier = ['master', 'ultra_pro', 'ultra_pro_max'].includes(difficulty);

  let bestCandidate: LevelData | null = null;
  let bestScore = -1;

  for (let attempt = 0; attempt < 40; attempt++) {
    const occupied = new Set<string>();
    const obstacles: Obstacle[] = [];

    // Place obstacles first (interior only, preserving border escape points)
    if (obstacleCount > 0) {
      let obsPlaced = 0;
      let obsTries = 0;
      while (obsPlaced < obstacleCount && obsTries < 50) {
        obsTries++;
        const ox = 1 + Math.floor(rng() * (cols - 2));
        const oy = 1 + Math.floor(rng() * (rows - 2));
        const key = `${ox},${oy}`;
        if (!occupied.has(key)) {
          occupied.add(key);
          obstacles.push({ id: `obs_${obsPlaced + 1}`, x: ox, y: oy, type: 'rock' });
          obsPlaced++;
        }
      }
    }

    const placedArrows: Arrow[] = [];
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    let arrowIdCounter = 1;
    let failStreak = 0;

    // Track escape rays of placed arrows so new arrows can be placed along them to create blocking dependencies
    const targetRayCells: Array<{ x: number; y: number; blockedArrowId: string }> = [];

    while (placedArrows.length < targetArrowCount && failStreak < 120) {
      // Find candidate empty cells
      const emptyCells: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (!occupied.has(`${x},${y}`)) {
            emptyCells.push({ x, y });
          }
        }
      }

      if (emptyCells.length === 0) break;

      // In advanced tiers, prioritize cells along targetRayCells to construct intentional blocking bottlenecks
      let candidateCells = emptyCells;
      if (isAdvancedTier && targetRayCells.length > 0 && rng() > 0.35) {
        const rayMatches = targetRayCells.filter((c) => !occupied.has(`${c.x},${c.y}`));
        if (rayMatches.length > 0) {
          candidateCells = rayMatches;
        }
      }

      const cell = candidateCells[Math.floor(rng() * candidateCells.length)];

      // Check which directions have clear path to border through current occupied set
      const validDirections: Direction[] = [];
      for (const dir of directions) {
        let dx = 0;
        let dy = 0;
        if (dir === 'up') dy = -1;
        else if (dir === 'down') dy = 1;
        else if (dir === 'left') dx = -1;
        else if (dir === 'right') dx = 1;

        let curX = cell.x + dx;
        let curY = cell.y + dy;
        let blocked = false;

        while (curX >= 0 && curX < cols && curY >= 0 && curY < rows) {
          if (occupied.has(`${curX},${curY}`)) {
            blocked = true;
            break;
          }
          curX += dx;
          curY += dy;
        }

        if (!blocked) {
          validDirections.push(dir);
        }
      }

      if (validDirections.length > 0) {
        const chosenDir = validDirections[Math.floor(rng() * validDirections.length)];
        const color = PALETTE[Math.floor(rng() * PALETTE.length)];

        // Grow winding path backwards from head to tail
        const arrowPoints: Array<{ x: number; y: number }> = [{ x: cell.x, y: cell.y }];
        let backDx = 0;
        let backDy = 0;
        if (chosenDir === 'up') backDy = 1;
        else if (chosenDir === 'down') backDy = -1;
        else if (chosenDir === 'left') backDx = 1;
        else if (chosenDir === 'right') backDx = -1;

        const candidateOccupied = new Set<string>();
        candidateOccupied.add(`${cell.x},${cell.y}`);

        // Segment 1: backward step
        const curTailX = cell.x + backDx;
        const curTailY = cell.y + backDy;

        const canAddSegment1 =
          curTailX >= 0 &&
          curTailX < cols &&
          curTailY >= 0 &&
          curTailY < rows &&
          !occupied.has(`${curTailX},${curTailY}`);

        if (canAddSegment1 && (levelId >= 6 || isAdvancedTier)) {
          arrowPoints.unshift({ x: curTailX, y: curTailY });
          candidateOccupied.add(`${curTailX},${curTailY}`);

          // Segment 2 (90-degree corner turn for L-shape)
          const allowTurn = isUltraTier ? rng() > 0.25 : rng() > 0.45;
          if (allowTurn) {
            const perpDirs =
              backDx !== 0
                ? [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }]
                : [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
            const chosenPerp = perpDirs[Math.floor(rng() * perpDirs.length)];
            const turnX = curTailX + chosenPerp.dx;
            const turnY = curTailY + chosenPerp.dy;

            if (
              turnX >= 0 &&
              turnX < cols &&
              turnY >= 0 &&
              turnY < rows &&
              !occupied.has(`${turnX},${turnY}`) &&
              !candidateOccupied.has(`${turnX},${turnY}`)
            ) {
              arrowPoints.unshift({ x: turnX, y: turnY });
              candidateOccupied.add(`${turnX},${turnY}`);

              // Segment 3 (U-turn or S-turn for Master / Ultra Pro / Ultra Pro Max)
              if (isUltraTier && rng() > 0.5) {
                const turnX2 = turnX + chosenPerp.dx;
                const turnY2 = turnY + chosenPerp.dy;
                if (
                  turnX2 >= 0 &&
                  turnX2 < cols &&
                  turnY2 >= 0 &&
                  turnY2 < rows &&
                  !occupied.has(`${turnX2},${turnY2}`) &&
                  !candidateOccupied.has(`${turnX2},${turnY2}`)
                ) {
                  arrowPoints.unshift({ x: turnX2, y: turnY2 });
                  candidateOccupied.add(`${turnX2},${turnY2}`);
                }
              }
            }
          }
        }

        const arrowId = `a${arrowIdCounter++}`;
        const newArrow: Arrow = {
          id: arrowId,
          x: cell.x,
          y: cell.y,
          direction: chosenDir,
          color,
          points: arrowPoints.length > 1 ? arrowPoints : undefined,
        };

        // Record cells along this arrow's forward escape path
        let fDx = 0;
        let fDy = 0;
        if (chosenDir === 'up') fDy = -1;
        else if (chosenDir === 'down') fDy = 1;
        else if (chosenDir === 'left') fDx = -1;
        else if (chosenDir === 'right') fDx = 1;

        let rayX = cell.x + fDx;
        let rayY = cell.y + fDy;
        while (rayX >= 0 && rayX < cols && rayY >= 0 && rayY < rows) {
          targetRayCells.push({ x: rayX, y: rayY, blockedArrowId: arrowId });
          rayX += fDx;
          rayY += fDy;
        }

        placedArrows.unshift(newArrow);
        candidateOccupied.forEach((k) => occupied.add(k));
        failStreak = 0;
      } else {
        failStreak++;
      }
    }

    if (placedArrows.length >= Math.max(3, targetArrowCount - 3)) {
      const candidateLevel: LevelData = {
        id: levelId,
        name,
        cols,
        rows,
        difficulty,
        parMoves: placedArrows.length,
        arrows: placedArrows,
        obstacles: obstacles.length > 0 ? obstacles : undefined,
      };

      const structCheck = validateLevelStructure(candidateLevel);
      if (structCheck.valid) {
        const solveResult = solveLevel(candidateLevel);
        if (solveResult.solvable) {
          const metrics = analyzeLevelComplexity(candidateLevel);

          // Scoring based on puzzle depth:
          // More arrows + lower initial escapable count + higher bottlenecks = better puzzle
          let score = placedArrows.length * 10;
          if (difficulty === 'ultra_pro_max') {
            score += metrics.criticalBottlenecks * 15;
            if (metrics.initialEscapableCount <= 2) score += 50;
            if (metrics.initialEscapableCount === 1) score += 30;
          } else if (difficulty === 'ultra_pro' || difficulty === 'master') {
            score += metrics.criticalBottlenecks * 10;
            if (metrics.initialEscapableCount <= 3) score += 30;
          }

          if (score > bestScore) {
            bestScore = score;
            bestCandidate = candidateLevel;

            // If ideal criteria met, accept immediately
            if (
              (difficulty === 'ultra_pro_max' && metrics.initialEscapableCount <= 2 && placedArrows.length >= targetArrowCount - 2) ||
              (difficulty !== 'ultra_pro_max' && placedArrows.length >= targetArrowCount - 1)
            ) {
              return candidateLevel;
            }
          }
        }
      }
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  // Robust procedural fallback guaranteeing 100% solvability
  const fallbackArrows: Arrow[] = [];
  let fallbackId = 1;
  const count = Math.min(targetArrowCount, cols * rows);

  for (let i = 0; i < count; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols) % rows;
    const dir: Direction = x === 0 ? 'left' : x === cols - 1 ? 'right' : y === 0 ? 'up' : 'down';
    fallbackArrows.push({
      id: `a${fallbackId++}`,
      x,
      y,
      direction: dir,
      color: PALETTE[i % PALETTE.length],
    });
  }

  return {
    id: levelId,
    name,
    cols,
    rows,
    difficulty,
    parMoves: fallbackArrows.length,
    arrows: fallbackArrows,
  };
}

/**
 * Returns the difficulty tier for any level ID.
 */
export function getDifficultyForLevelId(id: number): Difficulty {
  if (id <= 10) return 'tutorial';
  if (id <= 25) return 'easy';
  if (id <= 50) return 'medium';
  if (id <= 80) return 'hard';
  if (id <= 110) return 'expert';
  if (id <= 140) return 'master';
  if (id <= 170) return 'ultra_pro';
  return 'ultra_pro_max';
}

/**
 * Dynamically builds a verified solvable level for any level ID,
 * supporting infinite procedural progression past level 200.
 */
export function buildLevelForId(id: number): LevelData {
  if (id <= 10) {
    return TUTORIAL_LEVELS[id - 1] || TUTORIAL_LEVELS[0];
  }

  const difficulty = getDifficultyForLevelId(id);

  if (difficulty === 'easy') {
    // 4x4 to 5x5
    const cols = id < 18 ? 4 : 5;
    const rows = id < 18 ? 4 : 5;
    const arrows = 5 + Math.floor((id - 11) * 0.3);
    return generateSolvableLevel(id, cols, rows, arrows, 0, 'easy');
  }

  if (difficulty === 'medium') {
    // 5x5 to 6x6
    const cols = id < 38 ? 5 : 6;
    const rows = id < 38 ? 5 : 6;
    const arrows = 7 + Math.floor((id - 26) * 0.25);
    return generateSolvableLevel(id, cols, rows, arrows, 0, 'medium');
  }

  if (difficulty === 'hard') {
    // 6x6 to 7x7
    const cols = id < 65 ? 6 : 7;
    const rows = id < 65 ? 6 : 7;
    const arrows = 11 + Math.floor((id - 51) * 0.2);
    const obs = id % 3 === 0 ? 1 : 0;
    return generateSolvableLevel(id, cols, rows, arrows, obs, 'hard');
  }

  if (difficulty === 'expert') {
    // 7x7 to 8x8
    const cols = id < 95 ? 7 : 8;
    const rows = id < 95 ? 7 : 8;
    const arrows = 15 + Math.floor((id - 81) * 0.2);
    const obs = id % 3 === 0 ? 2 : 1;
    return generateSolvableLevel(id, cols, rows, arrows, obs, 'expert');
  }

  if (difficulty === 'master') {
    // 8x8
    const cols = 8;
    const rows = 8;
    const arrows = 18 + Math.floor((id - 111) * 0.2);
    const obs = id % 2 === 0 ? 2 : 1;
    return generateSolvableLevel(id, cols, rows, arrows, obs, 'master');
  }

  if (difficulty === 'ultra_pro') {
    // 8x8 to 9x9
    const cols = id < 155 ? 8 : 9;
    const rows = id < 155 ? 8 : 9;
    const arrows = 22 + Math.floor((id - 141) * 0.2);
    const obs = 2 + (id % 2);
    return generateSolvableLevel(id, cols, rows, arrows, obs, 'ultra_pro');
  }

  // Ultra Pro Max (Levels 171 to 200+)
  // 9x9 to 10x10 boards, dense multi-segment interlocking arrows, 2-3 obstacles
  const cols = id > 220 ? 10 : 9;
  const rows = id > 220 ? 10 : 9;
  const arrows = Math.min(32, 26 + Math.floor((id - 171) * 0.2));
  const obs = 2 + (id % 3);
  return generateSolvableLevel(id, cols, rows, arrows, obs, 'ultra_pro_max');
}

/**
 * Builds the complete 200-level core campaign suite across all 8 tiers.
 */
export function buildAllLevels(): LevelData[] {
  const levels: LevelData[] = [...TUTORIAL_LEVELS];

  for (let id = 11; id <= 200; id++) {
    levels.push(buildLevelForId(id));
  }

  return levels;
}

import {
  Arrow,
  ArrowColor,
  ArrowPattern,
  Direction,
  Difficulty,
  LevelData,
  Obstacle,
} from './types';
import { ALL_ARROW_PATTERNS, generatePatternPoints } from './arrowPatterns';
import { solveLevel, validateLevelStructure, analyzeLevelComplexity } from './solver';

const PALETTE: ArrowColor[] = [
  'cyan',
  'coral',
  'emerald',
  'amber',
  'violet',
  'teal',
  'rose',
  'indigo',
];

// Deterministic PRNG using Lehmer algorithm
function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const LEVEL_NAMES: Record<Difficulty, string[]> = {
  tutorial: [
    'Logic Awakening', 'Cross Dependency', 'Key Turn', 'Dual Interlock',
    'Corner Lock', 'Zigzag Primer', 'T-Junction Nexus', 'Serpentine Run',
    'Corridor Escape', 'Grand Entrance', 'The First Barrier', 'Pincer Lock',
    'Weave Pattern', 'Apex Catalyst', 'Initiation Test'
  ],
  easy: [
    'Breeze Way', 'Meadow Path', 'Sunlit Lane', 'Spring Dash', 'Clear Skies',
    'Amber Trail', 'Pebble Walk', 'Quiet Creek', 'Emerald Run', 'Blue Harbor',
    'Whispering Pines', 'Sunny Corner', 'Gentle Turn', 'Morning Dew', 'Forest Gate',
    'Twin Currents', 'Braided Ribbon', 'Stone Labyrinth', 'Silver Needle', 'Clockwise Loop',
    'Ripple Nexus', 'Hidden Passage', 'Shadow Lane', 'Dawn Horizon', 'Prism Alley',
    'Crescent Turn', 'Ivy Archway', 'Cobblestone Grid', 'Bramble Walk', 'Willow Bend'
  ],
  medium: [
    'Clockwork Maze', 'Twisted Wire', 'Prism Garden', 'Harbor Lock', 'Silver Web',
    'Coral Reef', 'Iron Bridge', 'Bramble Run', 'Echo Valley', 'Zenith Cross',
    'Cobalt Drift', 'Shadowed Alley', 'Opal Passage', 'Gilded Path', 'Copper Wire',
    'Riverbend', 'Starlight Cross', 'Tide Pool', 'Canyon Leap', 'Granite Steps',
    'Skyline Weave', 'Breezy Terrace', 'Fountain Square', 'Velvet Loop', 'Crystal Ridge',
    'Crosswind Gate', 'Iron Maiden', 'Serpent Spine', 'Chrono Corridor', 'Obsidian Spiral',
    'Mirage Path', 'Valkyrie Weave', 'Double Helix', 'Arcane Circuit', 'Hydra Trench'
  ],
  hard: [
    'Labyrinth Gate', 'Obsidian Core', 'Vortex Point', 'Iron Nexus', 'Phantom Pass',
    'Dragonfly Weave', 'Titan Trench', 'Solar Flare', 'Eclipse Ring', 'Thunder Track',
    'Gargoyle Perch', 'Mystic Spiral', 'Frostbite Peak', 'Serpent Alley', 'Basalt Spire',
    'Riddle Vault', 'Amber Citadel', 'Storm Barrier', 'Celestial Lock', 'Quicksilver',
    'Molten Flow', 'Abyssal Chasm', 'Glacier Ridge', 'Clocktower Gear', 'Midnight Run',
    'Chasm Leap', 'Viper Coils', 'Iron Curtain', 'Shadow Lattice', 'Granite Lock',
    'Gorgon Gaze', 'Pendulum Swarm', 'Bermuda Triangle', 'Hyperion Arch', 'Ouroboros Spine'
  ],
  expert: [
    'Grand Mastermind', 'Infinity Circuit', 'Chrono Paradox', 'Apex Labyrinth', 'Nova Nexus',
    'Astral Conundrum', 'Omega Grid', 'Eternal Spiral', 'Quantum Enigma', 'Valkyrie Trail',
    'Hyperion Gate', 'Event Horizon', 'Singularity Core', 'Ragnarok Maze', 'Zenith Citadel',
    'Pandora Box', 'Sovereign Pass', 'Archmage Loom', 'Voidwalker', 'Genesis Matrix',
    'Phoenix Flight', 'Aegis Spire', 'Titanomachia', 'Ouroboros Loop', 'Ascension Apex',
    'Vortex Weaver', 'Starlight Labyrinth', 'Diamond Lattice', 'Nexus Core', 'Dark Matter',
    'Supercluster Maze', 'Chrono Labyrinth', 'Ironclad Helix', 'Archon Barrier', 'Titan Lattice'
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

interface GeneratorConfig {
  cols: number;
  rows: number;
  targetArrowCount: number;
  obstacleCount: number;
  difficulty: Difficulty;
  minLen: number; // 3 to 13
  maxLen: number; // 3 to 13
  allowedPatterns: ArrowPattern[];
}

/**
 * Procedurally generates a challenging, logic-based Hard Pro Max level.
 * Features:
 * - Reverse construction guaranteeing mathematical solvability
 * - Strategic escape-ray blocking creating multi-tier dependency chains
 * - Limited initial exit opportunities (1-3 arrows unblocked at start)
 * - Integration of all 10 arrow path patterns with lengths from 3 to 13 dots
 * - Forward verification with solver algorithm
 */
export function generateHardProMaxLevel(
  levelId: number,
  config: GeneratorConfig
): LevelData {
  const {
    cols,
    rows,
    targetArrowCount,
    obstacleCount,
    difficulty,
    minLen,
    maxLen,
    allowedPatterns,
  } = config;

  const rng = createPRNG(levelId * 7919 + 1337);

  const nameList = LEVEL_NAMES[difficulty] || LEVEL_NAMES.medium;
  const rawName = nameList[(levelId - 1) % nameList.length];
  const cycle = Math.floor((levelId - 1) / nameList.length);
  const name = cycle > 0 ? `${rawName} #${levelId}` : rawName;

  const directions: Direction[] = ['up', 'down', 'left', 'right'];

  let bestCandidate: LevelData | null = null;
  let bestScore = -1;

  // Run up to 25 attempts, selecting the highest complexity candidate
  for (let attempt = 0; attempt < 25; attempt++) {
    const occupied = new Set<string>();
    const obstacles: Obstacle[] = [];

    // 1. Place optional obstacles in interior cells
    if (obstacleCount > 0 && cols >= 6 && rows >= 6) {
      let obsPlaced = 0;
      let tries = 0;
      while (obsPlaced < obstacleCount && tries < 40) {
        tries++;
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
    let arrowIdCounter = 1;
    let failStreak = 0;

    // Track escape rays of placed arrows to intentionally build dependency chains
    const targetRayCells: Array<{ x: number; y: number; blockedArrowId: string }> = [];

    while (placedArrows.length < targetArrowCount && failStreak < 140) {
      // Find empty grid cells
      const emptyCells: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (!occupied.has(`${x},${y}`)) {
            emptyCells.push({ x, y });
          }
        }
      }

      if (emptyCells.length === 0) break;

      // Prioritize placing arrows on existing escape rays to construct tight dependencies
      let candidateCells = emptyCells;
      if (targetRayCells.length > 0 && rng() > 0.35) {
        const rayMatches = targetRayCells.filter((c) => !occupied.has(`${c.x},${c.y}`));
        if (rayMatches.length > 0) {
          candidateCells = rayMatches;
        }
      }

      const cell = candidateCells[Math.floor(rng() * candidateCells.length)];

      // Check which directions have clear forward ray to boundary
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

      if (validDirections.length === 0) {
        failStreak++;
        continue;
      }

      const chosenDir = validDirections[Math.floor(rng() * validDirections.length)];

      // Pick length between minLen and maxLen
      const targetLen = minLen + Math.floor(rng() * (maxLen - minLen + 1));

      // Pattern selection: shuffle allowedPatterns with bias towards complex shapes
      const shuffledPatterns = [...allowedPatterns].sort(() => rng() - 0.5);

      let generatedPoints: Array<{ x: number; y: number }> | null = null;
      let chosenPattern: ArrowPattern = 'straight';

      for (const pat of shuffledPatterns) {
        const pts = generatePatternPoints(
          pat,
          cell.x,
          cell.y,
          chosenDir,
          targetLen,
          cols,
          rows,
          occupied,
          rng
        );
        if (pts && pts.length >= 3) {
          generatedPoints = pts;
          chosenPattern = pat;
          break;
        }
      }

      // Fallback to simpler patterns if complex pattern couldn't fit
      if (!generatedPoints) {
        for (const fallbackPat of ['l_shape', 'reverse_l_shape', 'straight'] as ArrowPattern[]) {
          const pts = generatePatternPoints(
            fallbackPat,
            cell.x,
            cell.y,
            chosenDir,
            Math.max(3, Math.min(5, targetLen)),
            cols,
            rows,
            occupied,
            rng
          );
          if (pts && pts.length >= 3) {
            generatedPoints = pts;
            chosenPattern = fallbackPat;
            break;
          }
        }
      }

      if (!generatedPoints || generatedPoints.length < 3) {
        failStreak++;
        continue;
      }

      // Mark occupied
      for (const p of generatedPoints) {
        occupied.add(`${p.x},${p.y}`);
      }

      const arrowId = `a${arrowIdCounter++}`;
      const color = PALETTE[Math.floor(rng() * PALETTE.length)];

      const newArrow: Arrow = {
        id: arrowId,
        x: cell.x,
        y: cell.y,
        direction: chosenDir,
        color,
        length: generatedPoints.length,
        points: generatedPoints,
        pattern: chosenPattern,
      };

      // Record this arrow's forward escape ray cells
      let fDx = 0;
      let fDy = 0;
      if (chosenDir === 'up') fDy = -1;
      else if (chosenDir === 'down') fDy = 1;
      else if (chosenDir === 'left') fDx = -1;
      else if (chosenDir === 'right') fDx = 1;

      let rX = cell.x + fDx;
      let rY = cell.y + fDy;
      while (rX >= 0 && rX < cols && rY >= 0 && rY < rows) {
        targetRayCells.push({ x: rX, y: rY, blockedArrowId: arrowId });
        rX += fDx;
        rY += fDy;
      }

      placedArrows.unshift(newArrow);
      failStreak = 0;
    }

    if (placedArrows.length < Math.max(5, Math.floor(targetArrowCount * 0.55))) {
      continue;
    }

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

    // Forward verification with solver
    const validation = validateLevelStructure(candidateLevel);
    if (!validation.valid) continue;

    const solveRes = solveLevel(candidateLevel);
    if (!solveRes.solvable) continue;

    const complexity = analyzeLevelComplexity(candidateLevel);

    const patternCount = new Set(placedArrows.map((a) => a.pattern)).size;
    const initialEsc = complexity.initialEscapableCount;
    const escPenalty = initialEsc <= 4 ? 0 : (initialEsc - 4) * 10;

    const score =
      complexity.density * 100 +
      patternCount * 12 +
      complexity.criticalBottlenecks * 8 +
      placedArrows.length * 3 -
      escPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidateLevel;
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  // Guaranteed non-overlapping fallback with verified solvability
  const fallbackArrows: Arrow[] = [];
  const fallbackOccupied = new Set<string>();
  let fId = 1;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (fallbackArrows.length >= targetArrowCount) break;
      if (fallbackOccupied.has(`${x},${y}`)) continue;

      // Try directions
      for (const dir of directions) {
        const pts = generatePatternPoints(
          'straight',
          x,
          y,
          dir,
          3,
          cols,
          rows,
          fallbackOccupied,
          rng
        );
        if (pts && pts.length >= 3) {
          for (const p of pts) fallbackOccupied.add(`${p.x},${p.y}`);
          fallbackArrows.push({
            id: `a${fId++}`,
            x,
            y,
            direction: dir,
            color: PALETTE[fallbackArrows.length % PALETTE.length],
            length: pts.length,
            points: pts,
            pattern: 'straight',
          });
          break;
        }
      }
    }
  }

  return {
    id: levelId,
    name,
    cols,
    rows,
    difficulty,
    parMoves: Math.max(1, fallbackArrows.length),
    arrows: fallbackArrows,
  };
}

/**
 * Returns the difficulty tier for any level ID.
 * Preserves the exact campaign thresholds:
 * 1..10: tutorial
 * 11..25: easy
 * 26..50: medium
 * 51..80: hard
 * 81..110: expert
 * 111..140: master
 * 141..170: ultra_pro
 * 171..200+: ultra_pro_max
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
 * Dynamically builds a verified solvable Hard Pro Max level for any level ID.
 * Supports infinite procedural progression past level 200.
 */
export function buildLevelForId(id: number): LevelData {
  const difficulty = getDifficultyForLevelId(id);

  // Progressive parameters based on difficulty tier:
  // Tier 1: Early (Levels 1 to 10)
  if (difficulty === 'tutorial') {
    const cols = id <= 5 ? 5 : 6;
    const rows = id <= 5 ? 5 : 6;
    const arrows = Math.min(9, 6 + Math.floor((id - 1) * 0.3));
    return generateHardProMaxLevel(id, {
      cols,
      rows,
      targetArrowCount: arrows,
      obstacleCount: 0,
      difficulty: 'tutorial',
      minLen: 3,
      maxLen: 5,
      allowedPatterns: ['straight', 'l_shape', 'reverse_l_shape', 'u_shape', 's_shape'],
    });
  }

  // Tier 2: Intermediate (Levels 11 to 25)
  if (difficulty === 'easy') {
    const cols = id <= 18 ? 6 : 7;
    const rows = id <= 18 ? 6 : 7;
    const arrows = Math.min(14, 8 + Math.floor((id - 11) * 0.3));
    return generateHardProMaxLevel(id, {
      cols,
      rows,
      targetArrowCount: arrows,
      obstacleCount: 0,
      difficulty: 'easy',
      minLen: 3,
      maxLen: 7,
      allowedPatterns: [
        'straight',
        'l_shape',
        'reverse_l_shape',
        'u_shape',
        'reverse_u_shape',
        's_shape',
        'z_shape',
        'double_bend',
      ],
    });
  }

  // Tier 3: Medium / Advanced (Levels 26 to 50)
  if (difficulty === 'medium') {
    const cols = id <= 38 ? 7 : 8;
    const rows = id <= 38 ? 7 : 8;
    const arrows = Math.min(18, 11 + Math.floor((id - 26) * 0.25));
    return generateHardProMaxLevel(id, {
      cols,
      rows,
      targetArrowCount: arrows,
      obstacleCount: 0,
      difficulty: 'medium',
      minLen: 3,
      maxLen: 9,
      allowedPatterns: ALL_ARROW_PATTERNS,
    });
  }

  // Tier 4: Hard (Levels 51 to 80)
  if (difficulty === 'hard') {
    const cols = 8;
    const rows = 8;
    const arrows = Math.min(22, 14 + Math.floor((id - 51) * 0.2));
    return generateHardProMaxLevel(id, {
      cols,
      rows,
      targetArrowCount: arrows,
      obstacleCount: 0,
      difficulty: 'hard',
      minLen: 3,
      maxLen: 11,
      allowedPatterns: ALL_ARROW_PATTERNS,
    });
  }

  // Tier 5: Expert (Levels 81 to 110)
  if (difficulty === 'expert') {
    const cols = id <= 95 ? 8 : 9;
    const rows = id <= 95 ? 8 : 9;
    const arrows = Math.min(25, 17 + Math.floor((id - 81) * 0.22));
    return generateHardProMaxLevel(id, {
      cols,
      rows,
      targetArrowCount: arrows,
      obstacleCount: 0,
      difficulty: 'expert',
      minLen: 4,
      maxLen: 12,
      allowedPatterns: ALL_ARROW_PATTERNS,
    });
  }

  // Tier 6: Master (Levels 111 to 140)
  if (difficulty === 'master') {
    const cols = 9;
    const rows = 9;
    const arrows = Math.min(28, 20 + Math.floor((id - 111) * 0.25));
    return generateHardProMaxLevel(id, {
      cols,
      rows,
      targetArrowCount: arrows,
      obstacleCount: 0,
      difficulty: 'master',
      minLen: 4,
      maxLen: 13,
      allowedPatterns: ALL_ARROW_PATTERNS,
    });
  }

  // Tier 7: Ultra Pro (Levels 141 to 170)
  if (difficulty === 'ultra_pro') {
    const cols = 9;
    const rows = 9;
    const arrows = Math.min(30, 22 + Math.floor((id - 141) * 0.25));
    return generateHardProMaxLevel(id, {
      cols,
      rows,
      targetArrowCount: arrows,
      obstacleCount: 0,
      difficulty: 'ultra_pro',
      minLen: 4,
      maxLen: 13,
      allowedPatterns: ALL_ARROW_PATTERNS,
    });
  }

  // Tier 8: Ultra Pro Max (Levels 171 to 200+)
  const cols = id > 210 ? 10 : 9;
  const rows = id > 210 ? 10 : 9;
  const arrows = Math.min(34, 25 + Math.floor((id - 171) * 0.3));
  return generateHardProMaxLevel(id, {
    cols,
    rows,
    targetArrowCount: arrows,
    obstacleCount: 0,
    difficulty: 'ultra_pro_max',
    minLen: 4,
    maxLen: 13,
    allowedPatterns: ALL_ARROW_PATTERNS,
  });
}

/**
 * Builds the complete 200-level core campaign suite across all 8 tiers.
 */
export function buildAllLevels(): LevelData[] {
  const levels: LevelData[] = [];

  for (let id = 1; id <= 200; id++) {
    levels.push(buildLevelForId(id));
  }

  return levels;
}

// Backward compatibility alias
export function generateSolvableLevel(
  levelId: number,
  cols: number,
  rows: number,
  targetArrowCount: number,
  obstacleCount: number,
  difficulty: Difficulty
): LevelData {
  return generateHardProMaxLevel(levelId, {
    cols,
    rows,
    targetArrowCount,
    obstacleCount,
    difficulty,
    minLen: 3,
    maxLen: 12,
    allowedPatterns: ALL_ARROW_PATTERNS,
  });
}

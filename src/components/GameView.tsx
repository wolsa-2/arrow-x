import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  Settings as SettingsIcon,
  Navigation,
  Heart,
  Lightbulb,
  Hash,
  Undo2,
  Bomb,
} from 'lucide-react';
import { Arrow, LevelData, UserSettings } from '../game/types';
import { canArrowEscape, findEscapableArrows, calculateStars, findArrowAtBoardCoord } from '../game/rules';
import { cloneArrows } from '../game/levels';
import { WindingArrow } from './WindingArrow';
import { sound, triggerHaptic } from '../utils/audio';
import { ConfirmDialog } from './ConfirmDialog';

interface GameViewProps {
  level: LevelData;
  settings: UserSettings;
  hearts: number;
  hintsRemaining: number;
  bombsRemaining: number;
  undosRemaining: number;
  isPaused?: boolean;
  onHeartLost: (remainingHearts: number) => void;
  onUseHint: () => void;
  onUseBomb: (arrowId: string) => void;
  onUseUndo: () => void;
  onPause: () => void;
  onRestart?: () => void;
  onLevelComplete: (stars: number, moves: number, timeSeconds: number) => void;
  onGameOver: () => void;
  onOpenLevelSelect: () => void;
  onOpenHowToPlay: () => void;
}

function computeInitialCellSize(cols: number, rows: number): number {
  if (typeof window === 'undefined') return 64;
  const availW = Math.max(260, window.innerWidth - 36);
  const availH = Math.max(260, window.innerHeight * 0.58);
  const calculated = Math.min(Math.floor(availW / Math.max(1, cols)), Math.floor(availH / Math.max(1, rows)));
  return Math.max(44, Math.min(115, calculated));
}

export const GameViewComponent: React.FC<GameViewProps> = ({
  level,
  settings,
  hearts,
  hintsRemaining,
  bombsRemaining,
  undosRemaining,
  isPaused = false,
  onHeartLost,
  onUseHint,
  onUseBomb,
  onUseUndo,
  onPause,
  onRestart,
  onLevelComplete,
  onGameOver,
  onOpenLevelSelect,
}) => {
  // Always initialize active arrows from pristine cloned level arrows
  const [activeArrows, setActiveArrows] = useState<Arrow[]>(() => cloneArrows(level.arrows));
  const [history, setHistory] = useState<Arrow[][]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [escapingId, setEscapingId] = useState<string | null>(null);
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const [hintId, setHintId] = useState<string | null>(null);
  const [isBombActive, setIsBombActive] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Playfield container and SVG element measurement
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [cellSize, setCellSize] = useState<number>(() => computeInitialCellSize(level.cols, level.rows));

  // Animation and completion timeout refs to prevent stale callbacks
  const victoryTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const gameOverTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const blockedTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const clearAllPendingTimeouts = useCallback(() => {
    if (victoryTimeoutRef.current !== null) {
      clearTimeout(victoryTimeoutRef.current as any);
      victoryTimeoutRef.current = null;
    }
    if (gameOverTimeoutRef.current !== null) {
      clearTimeout(gameOverTimeoutRef.current as any);
      gameOverTimeoutRef.current = null;
    }
    if (blockedTimeoutRef.current !== null) {
      clearTimeout(blockedTimeoutRef.current as any);
      blockedTimeoutRef.current = null;
    }
  }, []);

  // In-game timer (pauses when paused, completed, or out of hearts)
  useEffect(() => {
    if (isCompleted || hearts <= 0 || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, hearts, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllPendingTimeouts();
    };
  }, [clearAllPendingTimeouts]);

  // Reset when level changes
  useEffect(() => {
    clearAllPendingTimeouts();
    const cloned = cloneArrows(level.arrows);
    activeArrowsRef.current = cloned;
    setActiveArrows(cloned);
    setHistory([]);
    setMoves(0);
    setElapsedSeconds(0);
    setEscapingId(null);
    setBlockedId(null);
    setHintId(null);
    setIsBombActive(false);
    setIsCompleted(false);
    setShowRestartConfirm(false);
    isProcessingTapRef.current = false;
    escapingIdRef.current = null;
    isBombActiveRef.current = false;
    isCompletedRef.current = false;
    movesRef.current = 0;
    elapsedSecondsRef.current = 0;
  }, [clearAllPendingTimeouts, level]);

  // Dynamically compute grid cell size to maximize board presence on mobile
  const updateBoardSize = useCallback(() => {
    if (!boardContainerRef.current) return;
    const { clientWidth, clientHeight } = boardContainerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return;

    // Use comfortable margins
    const availW = Math.max(260, clientWidth - 28);
    const availH = Math.max(260, clientHeight - 28);

    const sizeW = Math.floor(availW / level.cols);
    const sizeH = Math.floor(availH / level.rows);
    const calculated = Math.min(sizeW, sizeH);

    // Dynamic cell size between 44px (8x8) and 115px (3x3)
    setCellSize(Math.max(44, Math.min(115, calculated)));
  }, [level.cols, level.rows]);

  useEffect(() => {
    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, [updateBoardSize]);

  // Tap processing lock to strictly prevent duplicate taps or rapid multi-heart loss
  const isProcessingTapRef = useRef<boolean>(false);

  // Live state refs ensure collision check and tap callbacks always see the latest board state without closure lag
  const activeArrowsRef = useRef<Arrow[]>(activeArrows);
  activeArrowsRef.current = activeArrows;

  const heartsRef = useRef<number>(hearts);
  heartsRef.current = hearts;

  const movesRef = useRef<number>(moves);
  movesRef.current = moves;

  const elapsedSecondsRef = useRef<number>(elapsedSeconds);
  elapsedSecondsRef.current = elapsedSeconds;

  const isBombActiveRef = useRef<boolean>(isBombActive);
  isBombActiveRef.current = isBombActive;

  const isPausedRef = useRef<boolean>(isPaused);
  isPausedRef.current = isPaused;

  const isCompletedRef = useRef<boolean>(isCompleted);
  isCompletedRef.current = isCompleted;

  const escapingIdRef = useRef<string | null>(escapingId);
  escapingIdRef.current = escapingId;

  // Arrow Tap Handler with collision check before starting animation
  const handleArrowTap = useCallback(
    (arrow: Arrow) => {
      // Reject taps if already processing, escaping, paused, puzzle completed, or out of hearts
      if (
        isProcessingTapRef.current ||
        escapingIdRef.current !== null ||
        isCompletedRef.current ||
        heartsRef.current <= 0 ||
        isPausedRef.current
      ) {
        return;
      }
      isProcessingTapRef.current = true;

      setHintId(null);
      setBlockedId(null);

      const currentActive = activeArrowsRef.current;
      const liveArrow = currentActive.find((a) => a.id === arrow.id);
      if (!liveArrow) {
        isProcessingTapRef.current = false;
        return;
      }

      // Handle Bomb Power-up Mode: Destroys targeted arrow
      if (isBombActiveRef.current) {
        sound.playBomb(settings.soundEnabled);
        triggerHaptic('heavy', settings.hapticsEnabled);
        setIsBombActive(false);
        isBombActiveRef.current = false;
        setHistory((prev) => [...prev, currentActive]);
        const nextActive = currentActive.filter((a) => a.id !== liveArrow.id);
        activeArrowsRef.current = nextActive;
        setActiveArrows(nextActive);
        onUseBomb(liveArrow.id);
        isProcessingTapRef.current = false;

        if (nextActive.length === 0) {
          setIsCompleted(true);
          isCompletedRef.current = true;
          sound.playVictory(settings.soundEnabled);
          triggerHaptic('double', settings.hapticsEnabled);
          const stars = calculateStars(movesRef.current + 1, level.parMoves);
          clearAllPendingTimeouts();
          victoryTimeoutRef.current = setTimeout(() => {
            onLevelComplete(stars, movesRef.current + 1, elapsedSecondsRef.current);
          }, 120);
        }
        return;
      }

      const obstacles = level.obstacles || [];
      const result = canArrowEscape(liveArrow, currentActive, obstacles, level.cols, level.rows);

      if (!result.canEscape) {
        // Blocked move: turns coral-red, wiggles, deducts exactly 1 heart, never moves
        sound.playBlocked(settings.soundEnabled);
        triggerHaptic('medium', settings.hapticsEnabled);
        setBlockedId(liveArrow.id);

        const nextHearts = Math.max(0, heartsRef.current - 1);
        heartsRef.current = nextHearts;
        onHeartLost(nextHearts);

        clearAllPendingTimeouts();
        if (nextHearts === 0) {
          gameOverTimeoutRef.current = setTimeout(() => {
            isProcessingTapRef.current = false;
            onGameOver();
          }, 400);
        } else {
          blockedTimeoutRef.current = setTimeout(() => {
            setBlockedId(null);
            isProcessingTapRef.current = false;
          }, 350);
        }
        return;
      }

      // Valid escape: start polyline path animation
      sound.playEscape(settings.soundEnabled);
      triggerHaptic('light', settings.hapticsEnabled);
      escapingIdRef.current = liveArrow.id;
      setEscapingId(liveArrow.id);
    },
    [
      clearAllPendingTimeouts,
      level.cols,
      level.obstacles,
      level.parMoves,
      level.rows,
      onGameOver,
      onHeartLost,
      onLevelComplete,
      onUseBomb,
      settings.hapticsEnabled,
      settings.soundEnabled,
    ]
  );

  // Board-level pointer resolver: guarantees exact grid mapping from tap coordinates
  const handleBoardPointerTap = useCallback(
    (clientX: number, clientY: number, fallbackArrow?: Arrow) => {
      if (
        isProcessingTapRef.current ||
        escapingIdRef.current !== null ||
        isCompletedRef.current ||
        heartsRef.current <= 0 ||
        isPausedRef.current
      ) {
        return;
      }

      let targetArrow: Arrow | null = null;

      if (svgRef.current && clientX > 0 && clientY > 0) {
        const rect = svgRef.current.getBoundingClientRect();
        const clickX = clientX - rect.left;
        const clickY = clientY - rect.top;

        targetArrow = findArrowAtBoardCoord(
          activeArrowsRef.current,
          clickX,
          clickY,
          cellSize,
          level.cols,
          level.rows
        );
      }

      if (!targetArrow && fallbackArrow) {
        targetArrow = activeArrowsRef.current.find((a) => a.id === fallbackArrow.id) || null;
      }

      if (targetArrow) {
        handleArrowTap(targetArrow);
      }
    },
    [cellSize, handleArrowTap, level.cols, level.rows]
  );

  // Called strictly when arrow finishes escaping off the board
  const handleEscapeFinished = useCallback(
    (arrowId: string) => {
      const currentActive = activeArrowsRef.current;
      setHistory((prev) => [...prev, currentActive]);
      const nextMoves = movesRef.current + 1;
      setMoves(nextMoves);

      const nextActive = currentActive.filter((a) => a.id !== arrowId);
      activeArrowsRef.current = nextActive;
      setActiveArrows(nextActive);
      setEscapingId(null);
      isProcessingTapRef.current = false;

      // Check level completion
      if (nextActive.length === 0) {
        setIsCompleted(true);
        sound.playVictory(settings.soundEnabled);
        triggerHaptic('double', settings.hapticsEnabled);

        const stars = calculateStars(nextMoves, level.parMoves);
        clearAllPendingTimeouts();
        victoryTimeoutRef.current = setTimeout(() => {
          onLevelComplete(stars, nextMoves, elapsedSecondsRef.current);
        }, 120);
      }
    },
    [
      clearAllPendingTimeouts,
      level.parMoves,
      onLevelComplete,
      settings.hapticsEnabled,
      settings.soundEnabled,
    ]
  );

  // Undo move
  const handleUndo = () => {
    if (
      history.length === 0 ||
      escapingId !== null ||
      isCompleted ||
      undosRemaining <= 0 ||
      isPaused
    ) {
      return;
    }
    sound.playUndo(settings.soundEnabled);
    triggerHaptic('light', settings.hapticsEnabled);

    const prevArrows = history[history.length - 1];
    const restored = cloneArrows(prevArrows);
    activeArrowsRef.current = restored;
    setActiveArrows(restored);
    setHistory((h) => h.slice(0, -1));
    setMoves((m) => Math.max(0, m - 1));
    setHintId(null);
    onUseUndo();
  };

  // Hint button: highlights escapable arrow
  const handleHint = () => {
    if (escapingId !== null || isCompleted || hintsRemaining <= 0 || isPaused) return;
    const obstacles = level.obstacles || [];
    const escapable = findEscapableArrows(activeArrowsRef.current, obstacles, level.cols, level.rows);

    if (escapable.length > 0) {
      sound.playHint(settings.soundEnabled);
      triggerHaptic('light', settings.hapticsEnabled);
      setHintId(escapable[0].id);
      onUseHint();
    }
  };

  // Toggle bomb mode
  const handleBombToggle = () => {
    if (escapingId !== null || isCompleted || bombsRemaining <= 0 || isPaused) return;
    sound.playButton(settings.soundEnabled);
    triggerHaptic('light', settings.hapticsEnabled);
    setIsBombActive(!isBombActive);
  };

  // Centralized level restart
  const handleRestart = useCallback(() => {
    sound.playButton(settings.soundEnabled);
    triggerHaptic('light', settings.hapticsEnabled);
    clearAllPendingTimeouts();
    isProcessingTapRef.current = false;

    if (onRestart) {
      onRestart();
      return;
    }

    setActiveArrows(cloneArrows(level.arrows));
    setHistory([]);
    setMoves(0);
    setElapsedSeconds(0);
    setEscapingId(null);
    setBlockedId(null);
    setHintId(null);
    setIsBombActive(false);
    setIsCompleted(false);
    setShowRestartConfirm(false);
  }, [
    clearAllPendingTimeouts,
    level.arrows,
    onRestart,
    settings.hapticsEnabled,
    settings.soundEnabled,
  ]);

  const remainingCount = activeArrows.length;
  const boardWidth = level.cols * cellSize;
  const boardHeight = level.rows * cellSize;

  // Stacking order: Escaping arrow and hinted arrow render last (on top) in SVG DOM order
  const sortedArrows = useMemo(() => {
    return [...activeArrows].sort((a, b) => {
      if (a.id === escapingId) return 1;
      if (b.id === escapingId) return -1;
      if (a.id === hintId) return 1;
      if (b.id === hintId) return -1;
      return 0;
    });
  }, [activeArrows, escapingId, hintId]);

  const difficultyConfig = useMemo(() => {
    switch (level.difficulty) {
      case 'tutorial':
        return { label: 'Tutorial', badgeClass: 'bg-slate-100 text-slate-700' };
      case 'easy':
        return { label: 'Easy', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
      case 'medium':
        return { label: 'Normal', badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200' };
      case 'hard':
        return { label: 'Hard', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200' };
      case 'expert':
        return { label: 'Expert', badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200' };
      case 'master':
        return { label: 'Master', badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
      case 'ultra_pro':
        return { label: 'Ultra Pro', badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold' };
      case 'ultra_pro_max':
        return {
          label: 'Ultra Pro Max',
          badgeClass:
            'bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 text-white shadow-xs font-black tracking-wide',
        };
      default:
        return { label: 'Puzzle', badgeClass: 'bg-slate-100 text-slate-700' };
    }
  }, [level.difficulty]);

  const progressPercent = Math.min(
    100,
    Math.round(((level.arrows.length - remainingCount) / Math.max(1, level.arrows.length)) * 100)
  );

  return (
    <div className="relative w-full h-full bg-white text-slate-900 select-none overflow-hidden flex flex-col justify-between">
      {/* =========================================================
          TOP SECTION: MINIMALIST HEADER & HEARTS HUD (MATCHING SCREENSHOT 3)
         ========================================================= */}
      <header className="w-full px-4 pt-3 pb-1 z-20">
        <div className="w-full flex items-start justify-between">
          {/* Top-Left: Circular Back Arrow Button + Remaining Pill below */}
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              aria-label="Back / Pause game"
              onClick={() => {
                sound.playButton(settings.soundEnabled);
                triggerHaptic('light', settings.hapticsEnabled);
                onPause();
              }}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 hover:border-blue-400 flex items-center justify-center text-[#0077FE] shadow-2xs active:scale-90 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Remaining Arrows Count Pill (e.g. ↗ 112) */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs">
              <Navigation className="w-3.5 h-3.5 rotate-45 text-slate-600 fill-slate-600" />
              <span>{remainingCount}</span>
            </div>
          </div>

          {/* Top-Center: Level Number + Difficulty Pill */}
          <div className="flex flex-col items-center pt-1">
            <h2 className="text-xl font-black tracking-tight text-slate-900 font-sans">
              Level {level.id}
            </h2>
            <div className="mt-1 px-3 py-0.5 rounded-full bg-[#0077FE] text-white font-extrabold text-[11px] shadow-2xs uppercase tracking-wide">
              {difficultyConfig.label}
            </div>
          </div>

          {/* Top-Right: 3 Red Hearts + Settings Gear */}
          <div className="flex flex-col items-end gap-2">
            {/* 3 Red Hearts aligned horizontally */}
            <div className="flex items-center gap-1.5 pt-2">
              {[1, 2, 3].map((heartIndex) => {
                const isFilled = heartIndex <= hearts;
                return (
                  <Heart
                    key={heartIndex}
                    className={`w-5 h-5 transition-all duration-300 drop-shadow-sm ${
                      isFilled
                        ? 'text-rose-500 fill-rose-500 scale-100'
                        : 'text-slate-300 fill-slate-200 scale-90 opacity-40'
                    }`}
                  />
                );
              })}
            </div>

            {/* Blue outlined settings gear */}
            <button
              type="button"
              aria-label="Settings / Pause"
              onClick={() => {
                sound.playButton(settings.soundEnabled);
                triggerHaptic('light', settings.hapticsEnabled);
                onPause();
              }}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-blue-400 flex items-center justify-center text-[#0077FE] shadow-2xs active:scale-90 transition-all cursor-pointer mt-0.5"
            >
              <SettingsIcon className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        <div className="w-full px-1 mt-2">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                level.difficulty === 'ultra_pro_max'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Bomb Mode Banner */}
        {isBombActive && (
          <div className="w-full py-1.5 px-3 mt-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
            <Bomb className="w-3.5 h-3.5" />
            <span>Bomb Active: Tap any blocking arrow to destroy it!</span>
          </div>
        )}
      </header>

      {/* =========================================================
          MAIN SECTION: DYNAMIC CENTERED PUZZLE BOARD WITH DOT GRID
         ========================================================= */}
      <main
        ref={boardContainerRef}
        className="flex-1 w-full flex items-center justify-center relative p-3 overflow-hidden"
      >
        <div
          className="relative select-none touch-none rounded-2xl"
          style={{
            width: `${boardWidth}px`,
            height: `${boardHeight}px`,
          }}
        >
          {/* Main Board SVG: Dot Matrix + Winding Arrows Layer */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full overflow-visible cursor-pointer"
            width={boardWidth}
            height={boardHeight}
            onClick={(e) => handleBoardPointerTap(e.clientX, e.clientY)}
            style={{ touchAction: 'none' }}
          >
            {/* Subtle Dotted Matrix Grid (Matching Screenshot 1) */}
            <g className="pointer-events-none select-none">
              {Array.from({ length: level.rows }).map((_, r) =>
                Array.from({ length: level.cols }).map((_, c) => (
                  <circle
                    key={`dot-${c}-${r}`}
                    cx={c * cellSize + cellSize / 2}
                    cy={r * cellSize + cellSize / 2}
                    r="2.8"
                    fill="#CBD5E1"
                  />
                ))
              )}
            </g>

            {/* Winding Arrows Layer */}
            {sortedArrows.map((arrow) => {
              const isEscaping = escapingId === arrow.id;
              const isBlocked = blockedId === arrow.id;
              const isHinted = hintId === arrow.id;

              return (
                <WindingArrow
                  key={arrow.id}
                  arrow={arrow}
                  cellSize={cellSize}
                  boardCols={level.cols}
                  boardRows={level.rows}
                  isEscaping={isEscaping}
                  isBlocked={isBlocked}
                  isHinted={isHinted}
                  onEscapeFinished={() => handleEscapeFinished(arrow.id)}
                  onTap={(a, cx, cy) => handleBoardPointerTap(cx ?? 0, cy ?? 0, a)}
                />
              );
            })}
          </svg>
        </div>
      </main>

      {/* =========================================================
          BOTTOM SECTION: CONTROLS & POWER-UPS TOOLBAR (MATCHING SCREENSHOT 3)
         ========================================================= */}
      <footer className="w-full px-6 py-4 flex items-center justify-between z-20 max-w-sm mx-auto">
        {/* Undo Button (Auxiliary) */}
        <button
          type="button"
          aria-label={`Undo move (${undosRemaining} remaining)`}
          onClick={handleUndo}
          disabled={history.length === 0 || escapingId !== null || undosRemaining <= 0 || isPaused}
          className={`w-11 h-11 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center transition-transform active:scale-90 ${
            history.length > 0 && undosRemaining > 0 && !isPaused
              ? 'text-slate-600 hover:text-blue-600 cursor-pointer'
              : 'text-slate-300 cursor-not-allowed opacity-40'
          }`}
        >
          <Undo2 className="w-5 h-5" />
        </button>

        {/* PRIMARY FLOATING BUTTON 1: Lightbulb Hint with Blue Badge (Screen 3) */}
        <button
          type="button"
          aria-label={`Get a hint (${hintsRemaining} remaining)`}
          onClick={handleHint}
          disabled={hintsRemaining <= 0 || escapingId !== null || isPaused}
          className={`relative w-16 h-16 rounded-full bg-white shadow-xl shadow-blue-500/15 border border-slate-100 flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
            hintsRemaining > 0 && !isPaused
              ? 'text-[#0077FE] hover:text-[#0066E0]'
              : 'text-slate-300 cursor-not-allowed opacity-60'
          }`}
        >
          <Lightbulb className="w-8 h-8 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0077FE] text-white text-xs font-black flex items-center justify-center shadow-md">
            {hintsRemaining}
          </span>
        </button>

        {/* PRIMARY FLOATING BUTTON 2: Grid '#' Icon (Screen 3) */}
        <button
          type="button"
          aria-label="Level select"
          onClick={() => {
            sound.playButton(settings.soundEnabled);
            triggerHaptic('light', settings.hapticsEnabled);
            onOpenLevelSelect();
          }}
          className="w-16 h-16 rounded-full bg-white shadow-xl shadow-blue-500/15 border border-slate-100 flex items-center justify-center text-[#0077FE] hover:text-[#0066E0] active:scale-95 transition-transform cursor-pointer"
        >
          <Hash className="w-8 h-8 stroke-[2.4]" />
        </button>

        {/* Bomb Power-up (Auxiliary) */}
        <button
          type="button"
          aria-label={`Bomb power-up (${bombsRemaining} remaining)`}
          onClick={handleBombToggle}
          disabled={bombsRemaining <= 0 || escapingId !== null || isPaused}
          className={`w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center transition-transform active:scale-90 ${
            isBombActive
              ? 'bg-purple-600 text-white border-purple-700 shadow-md'
              : bombsRemaining > 0 && !isPaused
              ? 'bg-white text-purple-600 hover:text-purple-700 cursor-pointer shadow-xs'
              : 'bg-white text-slate-300 cursor-not-allowed opacity-40 shadow-xs'
          }`}
        >
          <Bomb className="w-5 h-5" />
        </button>
      </footer>

      {/* Restart Confirmation Dialog */}
      {showRestartConfirm && (
        <ConfirmDialog
          title="Restart Level?"
          description="Your current moves on this puzzle will be reset."
          confirmText="Restart"
          cancelText="Keep Playing"
          isDestructive={false}
          soundEnabled={settings.soundEnabled}
          hapticsEnabled={settings.hapticsEnabled}
          onConfirm={handleRestart}
          onCancel={() => setShowRestartConfirm(false)}
        />
      )}
    </div>
  );
};

export const GameView = React.memo(GameViewComponent);


import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Grid,
} from 'lucide-react';
import {
  initGame,
  moveBoard,
  spawnRandomTile,
  checkGameOver,
} from './utils/gameLogic';
import {
  playMoveSound,
  playMergeSound,
  playGameOverSound,
  playHighScoreSound,
} from './utils/audio';
import Tile from './components/Tile';
import Modal from './components/Modal';

const AVAILABLE_SIZES = [4, 5, 6];

function getStorageKey(size) {
  return `sinabro_2048_${size}x${size}_best_score`;
}

export default function App() {
  const [gridSize, setGridSize] = useState(4);
  const [board, setBoard] = useState(() => initGame(4));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(4));
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isGameOver, setIsGameOver] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSizeSelectOpen, setIsSizeSelectOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasNewRecord, setHasNewRecord] = useState(false);

  // 스와이프/드래그 제스처 감지 ref
  const gestureStartRef = useRef({ x: 0, y: 0, time: 0, isDown: false });
  const isProcessingRef = useRef(false);

  // 격자 크기 변경 및 새 게임 시작
  const handleChangeGridSize = useCallback((newSize) => {
    setGridSize(newSize);
    const newBoard = initGame(newSize);
    setBoard(newBoard);
    setScore(0);
    setIsGameOver(false);
    setHasNewRecord(false);
    setIsSizeSelectOpen(false);
    isProcessingRef.current = false;

    try {
      const saved = localStorage.getItem(getStorageKey(newSize));
      setBestScore(saved ? parseInt(saved, 10) : 0);
    } catch {
      setBestScore(0);
    }
  }, []);

  // 최고 점수 갱신 처리
  const updateBestScore = useCallback((newScore, size) => {
    setBestScore((prevBest) => {
      if (newScore > prevBest) {
        try {
          localStorage.setItem(getStorageKey(size), newScore.toString());
        } catch {
          // localStorage 예외 무시
        }
        return newScore;
      }
      return prevBest;
    });
  }, []);

  // 게임 재시작
  const handleRestart = useCallback(() => {
    const newBoard = initGame(gridSize);
    setBoard(newBoard);
    setScore(0);
    setIsGameOver(false);
    setHasNewRecord(false);
    isProcessingRef.current = false;
  }, [gridSize]);

  // 방향 이동 핸들러
  const handleMove = useCallback(
    (direction) => {
      if (isGameOver || isProcessingRef.current) return;
      isProcessingRef.current = true;

      setBoard((currentBoard) => {
        const moveResult = moveBoard(currentBoard, direction);

        if (!moveResult.moved) {
          isProcessingRef.current = false;
          return currentBoard;
        }

        // 효과음 재생
        if (soundEnabled) {
          if (moveResult.hasMerged) {
            playMergeSound(moveResult.maxMergedValue);
          } else {
            playMoveSound();
          }
        }

        // 점수 갱신
        const nextScore = score + moveResult.scoreGained;
        if (moveResult.scoreGained > 0) {
          setScore(nextScore);

          if (nextScore > bestScore && !hasNewRecord && bestScore > 0) {
            setHasNewRecord(true);
            if (soundEnabled) playHighScoreSound();
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#a7f3d0', '#bae6fd', '#fed7aa', '#fbcfe8'],
            });
          }

          updateBestScore(nextScore, gridSize);
        }

        // 새 타일 생성
        const { newBoard: boardWithSpawn } = spawnRandomTile(moveResult.board);

        // 게임오버 체크
        if (checkGameOver(boardWithSpawn)) {
          setIsGameOver(true);
          if (soundEnabled) playGameOverSound();

          if (nextScore > bestScore) {
            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.5 },
              colors: ['#93c5fd', '#fca5a5', '#fde047', '#86efac'],
            });
          }
        }

        setTimeout(() => {
          isProcessingRef.current = false;
        }, 80);

        return boardWithSpawn;
      });
    },
    [isGameOver, soundEnabled, score, bestScore, hasNewRecord, updateBestScore, gridSize]
  );

  // 키보드 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleMove('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        handleMove('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        handleMove('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        handleMove('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // 터치 & 마우스 드래그 공통 처리
  const processGestureEnd = (endX, endY) => {
    const dx = endX - gestureStartRef.current.x;
    const dy = endY - gestureStartRef.current.y;
    const dt = Date.now() - gestureStartRef.current.time;

    const minDistance = 20;
    if (Math.abs(dx) < minDistance && Math.abs(dy) < minDistance) return;
    if (dt > 800) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) handleMove('RIGHT');
      else handleMove('LEFT');
    } else {
      if (dy > 0) handleMove('DOWN');
      else handleMove('UP');
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    gestureStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isDown: true,
    };
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    processGestureEnd(touch.clientX, touch.clientY);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    gestureStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      isDown: true,
    };
  };

  const handleMouseUp = (e) => {
    if (!gestureStartRef.current.isDown) return;
    gestureStartRef.current.isDown = false;
    processGestureEnd(e.clientX, e.clientY);
  };

  // 격자별 grid CSS 클래스 매핑
  const gridClassMap = {
    4: 'grid-cols-4 grid-rows-4 gap-2 sm:gap-2.5',
    5: 'grid-cols-5 grid-rows-5 gap-1.5 sm:gap-2',
    6: 'grid-cols-6 grid-rows-6 gap-1.5 sm:gap-2',
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 px-3 py-2 text-slate-200 select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* 중앙 핵심 콘텐츠 컨테이너 */}
      <div className="w-full max-w-[420px] flex flex-col items-center gap-2.5">
        {/* 상단 컨트롤 및 스코어 바 */}
        <div className="w-full flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2 shadow-lg backdrop-blur-md">
          {/* 점수 영역 */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1 min-w-[68px]">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                SCORE
              </span>
              <span className="text-[13px] font-bold text-sky-400">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col items-center bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1 min-w-[68px]">
              <div className="flex items-center gap-1 text-[11px] font-medium text-amber-400 uppercase tracking-wider">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>BEST</span>
              </div>
              <span className="text-[13px] font-bold text-amber-300">
                {bestScore.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 격자 크기 선택 및 유틸리티 버튼 */}
          <div className="flex items-center gap-1.5">
            {/* 격자 선택 팝업 열기 버튼 */}
            <button
              type="button"
              onClick={() => setIsSizeSelectOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-sky-300 hover:text-sky-200 border border-slate-700/60 transition-colors text-[12px] font-medium"
              title="격자 크기 변경"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{gridSize}x{gridSize}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 border border-slate-700/60 transition-colors"
              title="게임 방법"
              aria-label="도움말"
            >
              <HelpCircle className="w-4 h-4 text-sky-300" />
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-slate-100 border border-slate-700/60 transition-colors"
              title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
              aria-label="효과음 토글"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors text-[12px] font-medium"
              title="게임 재시작"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>재시작</span>
            </button>
          </div>
        </div>

        {/* 메인 격자판 (4x4, 5x5, 6x6 반응형) */}
        <div
          className={`w-full aspect-square bg-slate-900 border border-slate-800/90 rounded-2xl p-2 sm:p-2.5 shadow-2xl relative grid ${
            gridClassMap[gridSize] || gridClassMap[4]
          }`}
        >
          {board.map((row, r) =>
            row.map((tile, c) => (
              <div
                key={`cell-${r}-${c}`}
                className="w-full h-full bg-slate-800/40 rounded-lg border border-slate-800/60 flex items-center justify-center relative overflow-hidden"
              >
                {tile && <Tile tile={tile} gridSize={gridSize} />}
              </div>
            ))
          )}
        </div>

        {/* 미니멀 방향 컨트롤 패드 (클릭/터치 즉시 이동) */}
        <div className="w-full flex items-center justify-center pt-1">
          <div className="grid grid-cols-3 gap-1.5 w-44">
            <div />
            <button
              type="button"
              onClick={() => handleMove('UP')}
              className="h-9 flex items-center justify-center rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 active:scale-95 border border-slate-800 transition-all shadow-sm"
              aria-label="위로 이동"
            >
              <ArrowUp className="w-4 h-4 text-sky-400" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => handleMove('LEFT')}
              className="h-9 flex items-center justify-center rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 active:scale-95 border border-slate-800 transition-all shadow-sm"
              aria-label="왼쪽으로 이동"
            >
              <ArrowLeft className="w-4 h-4 text-sky-400" />
            </button>
            <button
              type="button"
              onClick={() => handleMove('DOWN')}
              className="h-9 flex items-center justify-center rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 active:scale-95 border border-slate-800 transition-all shadow-sm"
              aria-label="아래로 이동"
            >
              <ArrowDown className="w-4 h-4 text-sky-400" />
            </button>
            <button
              type="button"
              onClick={() => handleMove('RIGHT')}
              className="h-9 flex items-center justify-center rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 active:scale-95 border border-slate-800 transition-all shadow-sm"
              aria-label="오른쪽으로 이동"
            >
              <ArrowRight className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 격자 크기 선택 모달 */}
      <Modal
        isOpen={isSizeSelectOpen}
        onClose={() => setIsSizeSelectOpen(false)}
        title="격자 크기 선택"
        actions={
          <button
            type="button"
            onClick={() => setIsSizeSelectOpen(false)}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-slate-700/80 text-slate-200 hover:bg-slate-600 transition-colors"
          >
            취소
          </button>
        }
      >
        <div className="space-y-3">
          <p className="text-[12px] text-slate-300">
            플레이할 격자 크기를 선택해 주세요.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {AVAILABLE_SIZES.map((size) => (
              <button
                key={`size-${size}`}
                type="button"
                onClick={() => handleChangeGridSize(size)}
                className={`py-3 px-2 rounded-xl text-[12px] font-semibold border transition-all active:scale-95 flex flex-col items-center gap-1 ${
                  gridSize === size
                    ? 'bg-sky-200 text-sky-950 border-sky-300 shadow-md ring-2 ring-sky-400/50'
                    : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700/80'
                }`}
              >
                <span className="text-[14px] font-bold">{size} x {size}</span>
                <span className="text-[11px] opacity-80">{size * size} 칸</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* 게임 방법 안내 모달 */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="게임 방법"
        actions={
          <button
            type="button"
            onClick={() => setIsHelpOpen(false)}
            className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-indigo-200 text-indigo-950 hover:bg-indigo-300 active:scale-95 transition-all shadow-sm"
          >
            확인
          </button>
        }
      >
        <div className="space-y-3 text-left text-[12px] text-slate-300">
          <div>
            <span className="font-semibold text-slate-100">1. 조작 방법:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
              <li>키보드: 방향키(↑, ↓, ←, →) 또는 W, A, S, D</li>
              <li>화면: 격자판을 마우스로 드래그하거나 스마트폰으로 스와이프</li>
              <li>버튼: 격자판 아래의 방향 화살표 클릭</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-slate-100">2. 격자 선택:</span>
            <p className="mt-1 leading-relaxed text-slate-300">
              상단의 격자 버튼을 눌러 언제든지 4x4, 5x5, 6x6 모드로 전환할 수 있습니다.
            </p>
          </div>
          <div>
            <span className="font-semibold text-slate-100">3. 규칙 & 목표:</span>
            <p className="mt-1 leading-relaxed text-slate-300">
              한 방향으로 밀면 모든 타일이 이동하며 같은 숫자가 만나면 합쳐집니다. 빈 칸이 모두 차기 전까지 최고 점수에 도전하세요!
            </p>
          </div>
        </div>
      </Modal>

      {/* 게임 오버 모달 */}
      <Modal
        isOpen={isGameOver}
        onClose={() => setIsGameOver(false)}
        title="게임 종료"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGameOver(false)}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-slate-700/80 text-slate-200 hover:bg-slate-600 transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-teal-200 text-teal-950 hover:bg-teal-300 active:scale-95 transition-all shadow-sm"
            >
              다시 시작
            </button>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-[12px] text-slate-300">
            더 이상 이동할 수 있는 빈 칸이 없습니다. ({gridSize}x{gridSize} 모드)
          </p>
          <div className="py-2 px-3 bg-slate-800/80 rounded-xl border border-slate-700/50 flex justify-around items-center">
            <div className="text-center">
              <div className="text-[11px] text-slate-400">최종 점수</div>
              <div className="text-[15px] font-bold text-sky-300">
                {score.toLocaleString()}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-[11px] text-slate-400">최고 기록</div>
              <div className="text-[15px] font-bold text-amber-300">
                {bestScore.toLocaleString()}
              </div>
            </div>
          </div>
          {score >= bestScore && score > 0 && (
            <p className="text-[11px] font-semibold text-emerald-400">
              축하합니다! 역대 최고 점수를 경신했습니다!
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

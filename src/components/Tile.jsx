import React from 'react';

const TILE_STYLES = {
  2: 'bg-slate-800 text-slate-100 border-slate-700/80',
  4: 'bg-slate-700 text-slate-100 border-slate-600/80',
  8: 'bg-amber-700/90 text-amber-50 border-amber-500/50 shadow-sm',
  16: 'bg-orange-700/90 text-orange-50 border-orange-500/50 shadow-sm',
  32: 'bg-rose-700/90 text-rose-50 border-rose-500/50 shadow-sm',
  64: 'bg-red-700/90 text-red-50 border-red-500/60 shadow-md',
  128: 'bg-yellow-600/90 text-yellow-50 border-yellow-400/60 shadow-[0_0_12px_rgba(234,179,8,0.3)]',
  256: 'bg-lime-700/90 text-lime-50 border-lime-400/60 shadow-[0_0_12px_rgba(132,204,22,0.3)]',
  512: 'bg-emerald-700/90 text-emerald-50 border-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]',
  1024: 'bg-cyan-700/90 text-cyan-50 border-cyan-400/70 shadow-[0_0_16px_rgba(6,182,212,0.4)]',
  2048: 'bg-indigo-600 text-white border-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.5)]',
  4096: 'bg-purple-700 text-purple-50 border-purple-400/80 shadow-[0_0_22px_rgba(168,85,247,0.5)]',
  8192: 'bg-pink-700 text-pink-50 border-pink-400/90 shadow-[0_0_24px_rgba(236,72,153,0.6)]',
};

function getFontSize(value, gridSize = 4) {
  if (gridSize === 4) {
    if (value < 100) return 'text-[18px] sm:text-[22px] font-bold';
    if (value < 1000) return 'text-[15px] sm:text-[18px] font-bold';
    if (value < 10000) return 'text-[13px] sm:text-[15px] font-extrabold tracking-tight';
    return 'text-[11px] sm:text-[12px] font-black tracking-tight';
  } else if (gridSize === 5) {
    if (value < 100) return 'text-[16px] sm:text-[18px] font-bold';
    if (value < 1000) return 'text-[13px] sm:text-[15px] font-bold';
    if (value < 10000) return 'text-[11px] sm:text-[13px] font-extrabold tracking-tight';
    return 'text-[11px] font-black tracking-tight';
  } else {
    // 6x6
    if (value < 100) return 'text-[13px] sm:text-[15px] font-bold';
    if (value < 1000) return 'text-[12px] sm:text-[13px] font-bold';
    if (value < 10000) return 'text-[11px] sm:text-[12px] font-extrabold tracking-tighter';
    return 'text-[11px] font-black tracking-tighter';
  }
}

export default function Tile({ tile, gridSize = 4 }) {
  if (!tile) return null;

  const styleClass = TILE_STYLES[tile.value] || 'bg-fuchsia-700 text-white border-fuchsia-400 shadow-xl';
  const fontClass = getFontSize(tile.value, gridSize);
  const animClass = tile.isNew ? 'tile-new' : tile.isMerged ? 'tile-merged' : '';

  return (
    <div
      className={`w-full h-full flex items-center justify-center rounded-lg border select-none transition-all duration-100 ${styleClass} ${fontClass} ${animClass}`}
    >
      {tile.value}
    </div>
  );
}

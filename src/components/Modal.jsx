import React from 'react';

/**
 * 규칙 준수 모달창
 * - 바깥 클릭 시 창 종료
 * - 바깥 영역 마우스 커서 기본 유지 (cursor-default)
 * - 버튼 글자 크기 12px, 파스텔톤 색상
 * - 기본 글자 크기 12px, 최소 11px
 * - actions={null} 전달 시 하단 버튼 영역 미노출
 */
export default function Modal({ isOpen, onClose, title, children, actions }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-default"
      style={{ cursor: 'default' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl text-slate-200 text-[12px] animate-in fade-in zoom-in-95 duration-200"
      >
        {title && (
          <div className="text-center font-bold text-slate-100 text-[14px] mb-3">
            {title}
          </div>
        )}
        <div className={`text-slate-300 text-center text-[12px] leading-relaxed ${actions !== null ? 'mb-5' : ''}`}>
          {children}
        </div>
        {actions !== undefined ? (
          actions ? (
            <div className="flex items-center justify-center gap-2 mt-4">
              {actions}
            </div>
          ) : null
        ) : (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[12px] font-semibold bg-indigo-200 text-indigo-950 hover:bg-indigo-300 active:scale-95 transition-all shadow-sm"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

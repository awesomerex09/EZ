import React, { useRef, useCallback } from 'react';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

export function FrameScrubber({ currentFrame, setCurrentFrame, totalFrames, cards }) {
  const trackRef = useRef(null);

  const progressPct = totalFrames > 1 ? ((currentFrame / (totalFrames - 1)) * 100).toFixed(2) : 0;

  const handleTrackClick = useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentFrame(Math.round(ratio * (totalFrames - 1)));
  }, [totalFrames, setCurrentFrame]);

  const handleScrubberDrag = useCallback((e) => {
    if (e.buttons !== 1) return;
    handleTrackClick(e);
  }, [handleTrackClick]);

  return (
    <div className="flex flex-col gap-1 px-4 pb-3 pt-2 select-none">
      {/* Main Scrubber Row */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-white/50 shrink-0 w-8">F</span>
        <div
          ref={trackRef}
          className="relative flex-1 h-6 bg-white/5 rounded cursor-pointer group"
          onClick={handleTrackClick}
          onMouseMove={handleScrubberDrag}
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-white/10 rounded pointer-events-none"
            style={{ width: `${progressPct}%` }}
          />
          {/* Card timing bars */}
          {cards?.map((card, i) => {
            const startPct = card.timing.startProgress * 100;
            const widthPct = (card.timing.endProgress - card.timing.startProgress) * 100;
            const color = COLORS[i % COLORS.length];
            return (
              <div
                key={card.id}
                className="absolute top-1 h-4 rounded-sm opacity-70 pointer-events-none"
                style={{ left: `${startPct}%`, width: `${Math.max(widthPct, 0.5)}%`, backgroundColor: color }}
                title={card.content}
              />
            );
          })}
          {/* Playhead */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.5)] pointer-events-none"
            style={{ left: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs font-mono text-white/60 shrink-0 tabular-nums w-24 text-right">
          {currentFrame + 1} / {totalFrames}
        </span>
      </div>

      {/* Per-card label tracks */}
      {cards?.map((card, i) => {
        const startPct = card.timing.startProgress * 100;
        const widthPct = (card.timing.endProgress - card.timing.startProgress) * 100;
        const color = COLORS[i % COLORS.length];
        return (
          <div key={card.id} className="flex items-center gap-3">
            <span
              className="text-xs font-mono shrink-0 w-8 truncate text-right"
              style={{ color }}
              title={card.content}
            >
              {i + 1}
            </span>
            <div className="relative flex-1 h-3.5 bg-white/5 rounded">
              <div
                className="absolute top-0 h-full rounded text-xs flex items-center px-1 overflow-hidden"
                style={{ left: `${startPct}%`, width: `${Math.max(widthPct, 1)}%`, backgroundColor: color + '60', borderLeft: `2px solid ${color}` }}
                title={card.content}
              >
                <span className="text-white/80 font-mono text-[9px] truncate">{card.content}</span>
              </div>
              {/* Playhead */}
              <div
                className="absolute top-0 h-full w-px bg-white/40 pointer-events-none"
                style={{ left: `${progressPct}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-white/30 shrink-0 w-24 text-right tabular-nums">
              {Math.round(card.timing.startProgress * totalFrames)}–{Math.round(card.timing.endProgress * totalFrames)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

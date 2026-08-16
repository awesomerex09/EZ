import React, { useRef, useEffect, useState, useCallback } from 'react';

const SEQUENCE_BASE = 'http://localhost:3003/sequence';

// Simple LRU image cache shared across CanvasPreview instances
const imgCache = new Map();

function loadFrame(frameIndex) {
  if (imgCache.has(frameIndex)) return Promise.resolve(imgCache.get(frameIndex));
  return new Promise((resolve) => {
    const img = new Image();
    const num = (frameIndex + 1).toString().padStart(4, '0');
    img.onload = () => { imgCache.set(frameIndex, img); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = `${SEQUENCE_BASE}/frame_${num}.webp`;
  });
}

export function CanvasPreview({ currentFrame, config, selectedCardId, onCardSelect, onCardMove }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { cardId, offsetX, offsetY }

  // Draw current frame on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    loadFrame(currentFrame).then((img) => {
      if (!img) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const cr = canvas.width / canvas.height;
      const ir = img.width / img.height;
      let w, h, x, y;
      if (cr > ir) { w = canvas.width; h = w / ir; x = 0; y = (canvas.height - h) / 2; }
      else { h = canvas.height; w = h * ir; x = (canvas.width - w) / 2; y = 0; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, w, h);
    });
  }, [currentFrame]);

  // Prefetch neighboring frames
  useEffect(() => {
    for (let i = -5; i <= 5; i++) {
      const idx = currentFrame + i;
      if (idx >= 0 && !imgCache.has(idx)) loadFrame(idx);
    }
  }, [currentFrame]);

  const handleMouseDown = useCallback((e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging({ cardId, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    onCardSelect(cardId);
  }, [onCardSelect]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left - dragging.offsetX;
    const y = e.clientY - containerRect.top - dragging.offsetY;
    const topPct = ((y / containerRect.height) * 100).toFixed(1) + '%';
    const leftPct = ((x / containerRect.width) * 100).toFixed(1) + '%';
    onCardMove(dragging.cardId, topPct, leftPct);
  }, [dragging, onCardMove]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const cards = config?.cards || [];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg bg-black select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Card overlays */}
      {cards.map((card) => {
        const isActive = card.id === selectedCardId;
        const isVisible =
          currentFrame >= card.timing.startProgress * 3960 &&
          currentFrame <= card.timing.endProgress * 3960;

        return (
          <div
            key={card.id}
            onMouseDown={(e) => handleMouseDown(e, card.id)}
            style={{
              position: 'absolute',
              top: card.position.top,
              left: card.position.left,
              cursor: 'grab',
              opacity: isVisible ? (card.opacity ?? 1) : 0.35,
              transform: 'translate(-50%, -50%)',
              transition: 'opacity 0.2s',
              userSelect: 'none',
            }}
          >
            <div
              className={`px-5 py-3 rounded-xl backdrop-blur-md text-white font-semibold text-xl whitespace-nowrap
                ${isActive
                  ? 'ring-2 ring-blue-400 bg-blue-900/60 shadow-lg shadow-blue-500/30'
                  : 'bg-black/50 ring-1 ring-white/20'
                }`}
              style={{ fontSize: '1.1rem' }}
            >
              {card.content || 'Card'}
            </div>
            {isActive && (
              <div className="absolute -top-6 left-0 text-xs text-blue-300 font-mono whitespace-nowrap">
                {card.position.top} / {card.position.left}
              </div>
            )}
          </div>
        );
      })}

      {/* Frame number badge */}
      <div className="absolute bottom-3 right-3 bg-black/70 text-white/70 text-xs font-mono px-2 py-1 rounded">
        Frame {currentFrame + 1}
      </div>
    </div>
  );
}

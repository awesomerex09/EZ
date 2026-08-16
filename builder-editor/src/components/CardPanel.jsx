import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus, GripVertical } from 'lucide-react';

export function CardPanel({ config, setConfig, currentFrame, totalFrames, selectedCardId, onCardSelect }) {
  const { t } = useTranslation();

  const updateCard = (id, field, value) => {
    const newCards = config.cards.map((card) => {
      if (card.id !== id) return card;
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return { ...card, [parent]: { ...card[parent], [child]: value } };
      }
      return { ...card, [field]: value };
    });
    setConfig({ ...config, cards: newCards });
  };

  const deleteCard = (id) => {
    setConfig({ ...config, cards: config.cards.filter((c) => c.id !== id) });
  };

  const addCard = () => {
    const newCard = {
      id: `uuid-${Date.now()}`,
      content: 'New Card',
      opacity: 1,
      position: { top: '50%', left: '50%' },
      timing: { startProgress: currentFrame / totalFrames, endProgress: Math.min((currentFrame + 300) / totalFrames, 1) },
    };
    setConfig({ ...config, cards: [...config.cards, newCard] });
    onCardSelect(newCard.id);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <h2 className="text-base font-bold text-white">{t('cards.title')}</h2>
        <button
          onClick={addCard}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-xs font-medium transition"
        >
          <Plus size={13} />
          {t('cards.add')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {config.cards.map((card) => {
          const isActive = card.id === selectedCardId;
          const startF = Math.round(card.timing.startProgress * totalFrames);
          const endF = Math.round(card.timing.endProgress * totalFrames);

          return (
            <div
              key={card.id}
              onClick={() => onCardSelect(card.id)}
              className={`rounded-lg border transition cursor-pointer ${
                isActive
                  ? 'border-blue-500 bg-blue-950/50 shadow shadow-blue-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center gap-2 p-3">
                <GripVertical size={14} className="text-white/30 shrink-0" />
                <input
                  type="text"
                  value={card.content}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateCard(card.id, 'content', e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none border-b border-transparent focus:border-white/30"
                  placeholder="Card text..."
                />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                  className="text-white/30 hover:text-red-400 transition shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Expanded: only show when active */}
              {isActive && (
                <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                  {/* Position */}
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Position (Top / Left)</label>
                    <div className="flex gap-2">
                      <input
                        type="text" value={card.position.top}
                        onChange={(e) => updateCard(card.id, 'position.top', e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="50%"
                      />
                      <input
                        type="text" value={card.position.left}
                        onChange={(e) => updateCard(card.id, 'position.left', e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="50%"
                      />
                    </div>
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Opacity: {card.opacity ?? 1}</label>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={card.opacity ?? 1}
                      onChange={(e) => updateCard(card.id, 'opacity', parseFloat(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>

                  {/* Frame Timing */}
                  <div>
                    <label className="block text-xs text-white/50 mb-2">
                      Timeline: Frame {startF} → {endF}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateCard(card.id, 'timing.startProgress', currentFrame / totalFrames); }}
                        className="flex-1 bg-blue-700 hover:bg-blue-600 text-white text-xs py-1.5 rounded transition font-medium"
                      >
                        ◀ Set Start ({currentFrame})
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateCard(card.id, 'timing.endProgress', currentFrame / totalFrames); }}
                        className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs py-1.5 rounded transition font-medium"
                      >
                        Set End ({currentFrame}) ▶
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

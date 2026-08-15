import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlassPanel } from './GlassPanel';
import { Trash2 } from 'lucide-react';

export function Timeline({ config, setConfig, currentFrame }) {
  const { t } = useTranslation();

  const updateCard = (index, field, value) => {
    const newCards = [...config.cards];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newCards[index] = {
        ...newCards[index],
        [parent]: { ...newCards[index][parent], [child]: value }
      };
    } else {
      newCards[index] = { ...newCards[index], [field]: value };
    }
    setConfig({ ...config, cards: newCards });
  };

  const deleteCard = (index) => {
    const newCards = config.cards.filter((_, i) => i !== index);
    setConfig({ ...config, cards: newCards });
  };

  const addCard = () => {
    const newCard = {
      id: `uuid-${Date.now()}`,
      content: "New Card",
      opacity: 1,
      position: { top: "50%", left: "50%" },
      timing: { startProgress: 0.1, endProgress: 0.2 }
    };
    setConfig({ ...config, cards: [...config.cards, newCard] });
  };

  return (
    <GlassPanel className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t('cards.title')}</h2>
        <button onClick={addCard} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition">
          {t('cards.add')}
        </button>
      </div>

      <div className="space-y-6">
        {config.cards.map((card, index) => (
          <div key={card.id} className="p-4 bg-black/20 rounded-lg relative">
            <button 
              onClick={() => deleteCard(index)}
              className="absolute top-4 right-4 text-white/50 hover:text-red-400 transition"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="space-y-4 pr-8">
              <div>
                <label className="block text-sm mb-1 text-white/70">{t('cards.content')}</label>
                <input 
                  type="text" 
                  value={card.content}
                  onChange={(e) => updateCard(index, 'content', e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded p-2 text-white placeholder-white/30 focus:outline-none focus:border-white/50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-white/70">{t('cards.position')} (Top / Left)</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" value={card.position.top}
                      onChange={(e) => updateCard(index, 'position.top', e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded p-1.5 text-sm"
                    />
                    <input 
                      type="text" value={card.position.left}
                      onChange={(e) => updateCard(index, 'position.left', e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded p-1.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-white/70">{t('cards.timeline')} (Frame: {card.timing.startProgress} - {card.timing.endProgress})</label>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => updateCard(index, 'timing.startProgress', currentFrame)}
                      className="w-full bg-blue-600 hover:bg-blue-500 rounded p-1.5 text-sm transition"
                    >
                      Set Start
                    </button>
                    <button 
                      onClick={() => updateCard(index, 'timing.endProgress', currentFrame)}
                      className="w-full bg-red-600 hover:bg-red-500 rounded p-1.5 text-sm transition"
                    >
                      Set End
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlassPanel } from './GlassPanel';

export function EffectKnobs({ config, setConfig }) {
  const { t } = useTranslation();

  const handleFluidChange = (field, value) => {
    setConfig({
      ...config,
      effects: {
        ...config.effects,
        cursorHover: {
          ...config.effects.cursorHover,
          fluidSettings: {
            ...config.effects.cursorHover.fluidSettings,
            [field]: value
          }
        }
      }
    });
  };

  const handleToggle = (field, value) => {
    setConfig({
      ...config,
      effects: {
        ...config.effects,
        [field]: {
          ...config.effects[field],
          enabled: value
        }
      }
    });
  };

  return (
    <GlassPanel className="mb-6">
      <h2 className="text-xl font-bold mb-4">{t('effects.title')}</h2>
      
      <div className="space-y-4">
        {/* Cursor Hover Toggle */}
        <label className="flex items-center space-x-3 cursor-pointer">
          <input 
            type="checkbox" 
            className="form-checkbox h-5 w-5 rounded text-blue-500"
            checked={config.effects.cursorHover.enabled}
            onChange={(e) => handleToggle('cursorHover', e.target.checked)}
          />
          <span>{t('effects.cursorHover')}</span>
        </label>

        {config.effects.cursorHover.enabled && (
          <div className="pl-8 space-y-3">
            <div>
              <label className="block text-sm mb-1">{t('effects.pressure')}: {config.effects.cursorHover.fluidSettings.pressure}</label>
              <input 
                type="range" min="0.1" max="2.0" step="0.1" 
                className="w-full"
                value={config.effects.cursorHover.fluidSettings.pressure}
                onChange={(e) => handleFluidChange('pressure', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">{t('effects.radius')}: {config.effects.cursorHover.fluidSettings.radius}</label>
              <input 
                type="range" min="0.05" max="1.0" step="0.05" 
                className="w-full"
                value={config.effects.cursorHover.fluidSettings.radius}
                onChange={(e) => handleFluidChange('radius', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">{t('effects.color')}</label>
              <input 
                type="color" 
                className="h-8 w-16 bg-transparent rounded cursor-pointer"
                value={config.effects.cursorHover.fluidSettings.color}
                onChange={(e) => handleFluidChange('color', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}

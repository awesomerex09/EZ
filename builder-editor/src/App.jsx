import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import { EffectKnobs } from './components/EffectKnobs';
import { Timeline } from './components/Timeline';
import { GlassPanel } from './components/GlassPanel';
import { FrameScrubber } from './components/FrameScrubber';

function App() {
  const { t, i18n } = useTranslation();
  const [fullConfig, setFullConfig] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(1);

  useEffect(() => {
    fetch('http://localhost:3003/api/config/site-1')
      .then(res => res.json())
      .then(data => setFullConfig(data))
      .catch(err => console.error("Could not load config", err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('http://localhost:3003/api/config/site-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig)
      });
      const iframe = document.getElementById('preview-iframe');
      if (iframe) iframe.src = iframe.src;
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en-US' ? 'zh-TW' : 'en-US');
  };

  if (!fullConfig) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  const currentConfig = fullConfig[device];

  const updateCurrentConfig = (newDeviceConfig) => {
    setFullConfig({ ...fullConfig, [device]: newDeviceConfig });
  };
  
  // Format frame number to 4 digits (e.g. 0001)
  const frameStr = currentFrame.toString().padStart(4, '0');
  const bgImage = currentFrame > 1 ? `url('http://localhost:3003/sequence/frame_${frameStr}.webp')` : `url('/background/wallpaper.jpg')`;

  return (
    <div 
      className="min-h-screen bg-cover bg-center overflow-hidden flex flex-col transition-all duration-75"
      style={{ backgroundImage: bgImage }}
    >
      {/* Header */}
      <header className="h-16 border-b border-white/10 backdrop-blur-xl bg-black/40 flex items-center justify-between px-6 z-10 text-white">
        <h1 className="text-xl font-semibold tracking-wide">{t('editor.title')}</h1>
        <div className="flex space-x-4">
          <select 
            className="bg-white/10 border border-white/20 rounded px-3 py-1 text-sm outline-none focus:bg-black/60"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          >
            <option value="desktop" className="text-black">Desktop</option>
            <option value="mobile" className="text-black">Mobile</option>
          </select>
          <button 
            onClick={toggleLang}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded px-4 py-1 text-sm transition"
          >
            {i18n.language === 'en-US' ? '繁體中文' : 'English'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500 rounded px-6 py-1 text-sm font-medium transition"
          >
            {isSaving ? 'Saving...' : t('editor.save')}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Center: Live Preview */}
        <div className="flex-1 p-6 flex flex-col">
          <GlassPanel className="flex-1 flex flex-col p-2 overflow-hidden h-full">
            <div className="bg-black/50 w-full h-8 rounded-t-lg flex items-center px-4 space-x-2 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="text-xs text-white/50 ml-4">Live Preview (http://localhost:3002)</div>
            </div>
            <iframe 
              id="preview-iframe"
              src="http://localhost:3002" 
              className="w-full flex-1 bg-white rounded-b-lg border-none"
              title="Live Preview"
            />
          </GlassPanel>
        </div>

        {/* Right: Properties Panel */}
        <div className="w-[450px] border-l border-white/10 bg-black/40 backdrop-blur-xl p-6 overflow-y-auto">
          <FrameScrubber currentFrame={currentFrame} setCurrentFrame={setCurrentFrame} />
          <EffectKnobs config={currentConfig} setConfig={updateCurrentConfig} />
          <Timeline config={currentConfig} setConfig={updateCurrentConfig} currentFrame={currentFrame} />
        </div>
      </div>
    </div>
  );
}

export default App;

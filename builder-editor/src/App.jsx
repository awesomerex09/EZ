import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';
import { CanvasPreview } from './components/CanvasPreview';
import { CardPanel } from './components/CardPanel';
import { EffectKnobs } from './components/EffectKnobs';
import { FrameScrubber } from './components/FrameScrubber';
import { Monitor, Smartphone, Save, Globe, Layers, Zap, Settings } from 'lucide-react';

const TABS = [
  { id: 'cards', label: 'Cards', icon: Layers },
  { id: 'effects', label: 'Effects', icon: Zap },
];

function App() {
  const { t, i18n } = useTranslation();
  const [fullConfig, setFullConfig] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(3960);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [activeTab, setActiveTab] = useState('cards');
  const iframeRef = useRef(null);

  // Fetch config
  useEffect(() => {
    fetch('http://localhost:3003/api/config/site-1')
      .then((r) => r.json())
      .then((data) => {
        setFullConfig(data);
        if (data.desktop?.cards?.[0]) setSelectedCardId(data.desktop.cards[0].id);
      })
      .catch(console.error);
  }, []);

  // Fetch total frames
  useEffect(() => {
    fetch('http://localhost:3003/api/sequence-info')
      .then((r) => r.json())
      .then((d) => { if (d.totalFrames) setTotalFrames(d.totalFrames); })
      .catch(console.error);
  }, []);

  // Live-push config to the iframe renderer via postMessage
  useEffect(() => {
    if (!fullConfig || !iframeRef.current) return;
    try {
      iframeRef.current.contentWindow?.postMessage(
        { type: 'CONFIG_UPDATE', config: fullConfig },
        '*'
      );
    } catch (_) {}
  }, [fullConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('http://localhost:3003/api/config/site-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig),
      });
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const updateCurrentConfig = useCallback((newDeviceConfig) => {
    setFullConfig((prev) => ({ ...prev, [device]: newDeviceConfig }));
  }, [device]);

  const handleCardMove = useCallback((cardId, top, left) => {
    if (!fullConfig) return;
    const deviceConfig = fullConfig[device];
    const newCards = deviceConfig.cards.map((c) =>
      c.id === cardId ? { ...c, position: { top, left } } : c
    );
    updateCurrentConfig({ ...deviceConfig, cards: newCards });
  }, [fullConfig, device, updateCurrentConfig]);

  if (!fullConfig) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center">
        <div className="text-white/50 text-sm animate-pulse">Connecting to backend...</div>
      </div>
    );
  }

  const currentConfig = fullConfig[device];

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0f] text-white overflow-hidden font-sans">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-white/8 bg-[#111113]">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
            EZ
          </div>
          <span className="text-sm font-semibold text-white/80">Builder</span>
        </div>

        {/* Center: Device toggle */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition ${
              device === 'desktop' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Monitor size={13} /> Desktop
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition ${
              device === 'mobile' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Smartphone size={13} /> Mobile
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'en-US' ? 'zh-TW' : 'en-US')}
            className="flex items-center gap-1 text-white/40 hover:text-white/70 text-xs transition px-2 py-1.5"
          >
            <Globe size={13} />
            {i18n.language === 'en-US' ? '中文' : 'EN'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition"
          >
            <Save size={12} />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left: Canvas WYSIWYG Preview */}
        <div className="flex-1 flex flex-col min-w-0 p-3 gap-3">
          {/* Browser chrome mockup */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/8">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 bg-white/5 rounded text-[11px] text-white/30 px-3 py-0.5 text-center font-mono">
              localhost:3002 — Live Preview
            </div>
            <a
              href="http://localhost:3002"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/30 hover:text-white/60 transition"
            >
              ↗
            </a>
          </div>

          {/* Canvas */}
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/8 shadow-2xl">
            <CanvasPreview
              currentFrame={currentFrame}
              config={currentConfig}
              selectedCardId={selectedCardId}
              onCardSelect={setSelectedCardId}
              onCardMove={handleCardMove}
            />
          </div>
        </div>

        {/* Right: Properties Panel */}
        <div className="w-72 shrink-0 flex flex-col border-l border-white/8 bg-[#111113]">
          {/* Tab Bar */}
          <div className="flex border-b border-white/8 shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden p-3">
            {activeTab === 'cards' && (
              <CardPanel
                config={currentConfig}
                setConfig={updateCurrentConfig}
                currentFrame={currentFrame}
                totalFrames={totalFrames}
                selectedCardId={selectedCardId}
                onCardSelect={setSelectedCardId}
              />
            )}
            {activeTab === 'effects' && (
              <EffectKnobs config={currentConfig} setConfig={updateCurrentConfig} />
            )}
          </div>

          {/* Scroll Speed Setting */}
          <div className="shrink-0 border-t border-white/8 p-3">
            <label className="block text-[10px] text-white/40 mb-1.5">
              Scroll Speed × {currentConfig.scroll.speedMultiplier}
            </label>
            <input
              type="range" min="0.5" max="3.0" step="0.1"
              value={currentConfig.scroll.speedMultiplier}
              onChange={(e) => updateCurrentConfig({
                ...currentConfig,
                scroll: { ...currentConfig.scroll, speedMultiplier: parseFloat(e.target.value) }
              })}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ── BOTTOM: TIMELINE ───────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/8 bg-[#0a0a0c]" style={{ minHeight: '80px' }}>
        <FrameScrubber
          currentFrame={currentFrame}
          setCurrentFrame={setCurrentFrame}
          totalFrames={totalFrames}
          cards={currentConfig.cards}
        />
      </div>

      {/* Hidden iframe for live preview sync */}
      <iframe
        ref={iframeRef}
        src="http://localhost:3002"
        className="hidden"
        title="Sync Bridge"
      />
    </div>
  );
}

export default App;

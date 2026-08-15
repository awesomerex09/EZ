import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GlassPanel } from './GlassPanel';

export function FrameScrubber({ currentFrame, setCurrentFrame }) {
  const { t } = useTranslation();
  const [totalFrames, setTotalFrames] = useState(3960);

  useEffect(() => {
    fetch('http://localhost:3003/api/sequence-info')
      .then(res => res.json())
      .then(data => {
        if (data.totalFrames) setTotalFrames(data.totalFrames);
      })
      .catch(err => console.error("Could not fetch sequence info", err));
  }, []);

  return (
    <GlassPanel className="mb-6">
      <h2 className="text-xl font-bold mb-4 text-white">Frame Scrubber</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-white/70">
            Current Frame: {currentFrame} / {totalFrames}
          </label>
          <input 
            type="range" 
            min="1" 
            max={totalFrames} 
            value={currentFrame}
            onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </GlassPanel>
  );
}

import React from 'react';

export function GlassPanel({ children, className = '' }) {
  return (
    <div className={`backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-2xl p-6 text-white ${className}`}>
      {children}
    </div>
  );
}

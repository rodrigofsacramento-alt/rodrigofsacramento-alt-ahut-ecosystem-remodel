import React from 'react';
import { cn } from '../lib/utils';

interface QubitsLogoProps {
  collapsed?: boolean;
  className?: string;
}

export default function QubitsLogo({ collapsed, className }: QubitsLogoProps) {
  if (collapsed) {
    return (
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center relative group", className)}>
        {/* Glow background */}
        <div className="absolute inset-0 bg-[#00FFCC] rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
        {/* Q symbol */}
        <svg viewBox="0 0 32 32" className="w-9 h-9 relative z-10">
          <defs>
            <linearGradient id="qGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFCC" />
              <stop offset="100%" stopColor="#00E5FF" />
            </linearGradient>
            <filter id="glowFilter">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="16" cy="16" r="13" fill="none" stroke="url(#qGlow)" strokeWidth="2.5" opacity="0.8" />
          <circle cx="16" cy="16" r="4.5" fill="#00FFCC" filter="url(#glowFilter)" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 group", className)}>
      {/* Q symbol with glow */}
      <div className="relative w-12 h-12 shrink-0">
        <div className="absolute inset-0 bg-[#00FFCC] rounded-xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
        <svg viewBox="0 0 36 36" className="w-12 h-12 relative z-10">
          <defs>
            <linearGradient id="qubitsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00FFCC" />
              <stop offset="100%" stopColor="#00E5FF" />
            </linearGradient>
            <filter id="qubitsGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Outer ring */}
          <circle cx="18" cy="18" r="15" fill="none" stroke="url(#qubitsGrad)" strokeWidth="2.5" opacity="0.7" />
          {/* Inner qubit dot */}
          <circle cx="18" cy="18" r="5" fill="#00FFCC" filter="url(#qubitsGlow)" />
          {/* Orbital ring */}
          <ellipse cx="18" cy="18" rx="10" ry="4" fill="none" stroke="#00FFCC" strokeWidth="1" opacity="0.4" transform="rotate(-30 18 18)" />
        </svg>
      </div>

      {/* QUBITS text */}
      <span className="text-3xl font-black tracking-tighter text-white drop-shadow-[0_0_8px_rgba(0,255,204,0.3)]">
        QUB<span className="text-[#00FFCC] drop-shadow-[0_0_10px_rgba(0,255,204,0.6)]">ITS</span>
      </span>
    </div>
  );
}
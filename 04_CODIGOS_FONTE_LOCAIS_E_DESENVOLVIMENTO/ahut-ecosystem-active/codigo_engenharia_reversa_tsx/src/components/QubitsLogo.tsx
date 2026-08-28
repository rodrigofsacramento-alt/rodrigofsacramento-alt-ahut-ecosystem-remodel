import React from 'react';
import { cn } from '../lib/utils';

interface QubitsLogoProps {
  collapsed?: boolean;
  className?: string;
}

export default function QubitsLogo({ collapsed, className }: QubitsLogoProps) {
  if (collapsed) {
    return (
      <div className={cn("w-8 h-8 rounded flex items-center justify-center relative", className)}>
        <svg viewBox="0 0 32 32" className="w-8 h-8">
          {/* QUBITS compact mark - stylized Q with qubit dot */}
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
          {/* Outer ring + qubit */}
          <circle cx="16" cy="16" r="13" fill="none" stroke="url(#qGlow)" strokeWidth="2" opacity="0.6" />
          <circle cx="16" cy="16" r="4" fill="#00FFCC" filter="url(#glowFilter)" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Full QUBITS logo with neon cyan + glow */}
      <svg viewBox="0 0 180 40" className="h-9 w-auto">
        <defs>
          <linearGradient id="qubitsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00FFCC" />
            <stop offset="50%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00FFCC" />
          </linearGradient>
          <filter id="qubitsGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="qubitsGlowSoft">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Q qubit symbol */}
        <g filter="url(#qubitsGlow)">
          {/* Q letter shape */}
          <path
            d="M 8 20 C 8 10, 26 10, 26 20 C 26 30, 8 30, 8 20 Z"
            fill="none"
            stroke="url(#qubitsGrad)"
            strokeWidth="3"
          />
          {/* Q tail */}
          <line x1="23" y1="27" x2="28" y2="34" stroke="#00FFCC" strokeWidth="3" strokeLinecap="round" />
          {/* Qubit dot inside Q */}
          <circle cx="17" cy="20" r="3.5" fill="#00FFCC" />
        </g>

        {/* U */}
        <text x="38" y="30" fontFamily="'Inter', sans-serif" fontSize="28" fontWeight="700" fill="#00FFCC" filter="url(#qubitsGlowSoft)">
          U
        </text>
        {/* B */}
        <text x="62" y="30" fontFamily="'Inter', sans-serif" fontSize="28" fontWeight="700" fill="#00FFCC" filter="url(#qubitsGlowSoft)">
          B
        </text>
        {/* I */}
        <text x="88" y="30" fontFamily="'Inter', sans-serif" fontSize="28" fontWeight="700" fill="#00FFCC" filter="url(#qubitsGlowSoft)">
          I
        </text>
        {/* T */}
        <text x="107" y="30" fontFamily="'Inter', sans-serif" fontSize="28" fontWeight="700" fill="#00FFCC" filter="url(#qubitsGlowSoft)">
          T
        </text>
        {/* S accent */}
        <text x="133" y="30" fontFamily="'Inter', sans-serif" fontSize="28" fontWeight="700" fill="#00FFCC" filter="url(#qubitsGlow)">
          S
        </text>
      </svg>
    </div>
  );
}
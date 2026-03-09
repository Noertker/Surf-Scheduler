import React from 'react';
import { SvgXml } from 'react-native-svg';

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a1520"/>
      <stop offset="100%" style="stop-color:#060d16"/>
    </linearGradient>

    <linearGradient id="waveFlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#0369a1;stop-opacity:0.4"/>
      <stop offset="38%"  style="stop-color:#0ea5e9"/>
      <stop offset="62%"  style="stop-color:#06b6d4"/>
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:0.35"/>
    </linearGradient>

    <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:0.07"/>
      <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:0"/>
    </linearGradient>

    <linearGradient id="kFlow" x1="0%" y1="0%" x2="10%" y2="100%">
      <stop offset="0%"   style="stop-color:#dce8f0"/>
      <stop offset="100%" style="stop-color:#7aafc8"/>
    </linearGradient>

    <linearGradient id="sFlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   style="stop-color:#38bdf8"/>
      <stop offset="100%" style="stop-color:#0284c7"/>
    </linearGradient>

    <filter id="softBlur">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <filter id="dotGlow">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <filter id="waveGlow">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <clipPath id="innerClip">
      <rect x="14" y="14" width="172" height="172" rx="30"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="200" height="200" rx="44" fill="url(#bg)"/>

  <!-- Tide fill -->
  <path d="M14,148 C28,148 36,92 54,84 C68,78 74,110 90,94 C102,82 112,62 132,58 C152,54 160,80 186,84 L186,172 L14,172 Z"
        fill="url(#fillGrad)" clip-path="url(#innerClip)"/>

  <!-- Full tide curve dimmed -->
  <path d="M14,148 C28,148 36,92 54,84 C68,78 74,110 90,94 C102,82 112,62 132,58 C152,54 160,80 186,84"
        fill="none" stroke="#1a3a52" stroke-width="1.5" stroke-linecap="round" clip-path="url(#innerClip)"/>

  <!-- Window band -->
  <rect x="80" y="14" width="52" height="172" fill="#0ea5e9" fill-opacity="0.04" clip-path="url(#innerClip)"/>
  <line x1="80"  y1="14" x2="80"  y2="186" stroke="#0ea5e9" stroke-width="0.8" stroke-opacity="0.22" stroke-dasharray="4,4"/>
  <line x1="132" y1="14" x2="132" y2="186" stroke="#0ea5e9" stroke-width="0.8" stroke-opacity="0.22" stroke-dasharray="4,4"/>

  <!-- Bright tide segment in window -->
  <path d="M80,100 C88,94 94,82 100,76 C110,64 120,60 132,57"
        fill="none" stroke="url(#waveFlow)" stroke-width="2.8" stroke-linecap="round"
        filter="url(#waveGlow)" clip-path="url(#innerClip)"/>

  <!-- Peak dot -->
  <circle cx="106" cy="72" r="5" fill="#06b6d4" filter="url(#dotGlow)"/>
  <circle cx="106" cy="72" r="2.2" fill="#e0f9ff"/>

  <!-- Tick marks -->
  <line x1="38"  y1="168" x2="38"  y2="175" stroke="#1e3a52" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="80"  y1="168" x2="80"  y2="177" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.45"/>
  <line x1="106" y1="168" x2="106" y2="180" stroke="#06b6d4" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="132" y1="168" x2="132" y2="177" stroke="#0ea5e9" stroke-width="1.5" stroke-linecap="round" stroke-opacity="0.45"/>
  <line x1="164" y1="168" x2="164" y2="175" stroke="#1e3a52" stroke-width="1.5" stroke-linecap="round"/>

  <!-- KS monogram -->
  <text x="16" y="72"
        font-family="'Courier New', Courier, monospace"
        font-size="64"
        font-weight="700"
        fill="url(#kFlow)"
        letter-spacing="-2">K</text>
  <text x="56" y="72"
        font-family="'Courier New', Courier, monospace"
        font-size="52"
        font-weight="700"
        fill="url(#sFlow)"
        filter="url(#softBlur)">S</text>
</svg>`;

interface KairoLogoProps {
  size?: number;
}

export function KairoLogo({ size = 120 }: KairoLogoProps) {
  return <SvgXml xml={LOGO_SVG} width={size} height={size} />;
}

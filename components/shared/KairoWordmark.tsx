import React from 'react';
import { SvgXml } from 'react-native-svg';

/**
 * Compact wordmark version of "KAIROSURF" for headers.
 * Based on kairosurf-name-dark.svg but without background rect,
 * tagline, and tide curves — just the text for a clean header fit.
 */
const WORDMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 72">
  <defs>
    <linearGradient id="kairoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#93c8e0"/>
      <stop offset="100%" style="stop-color:#5ba4c7"/>
    </linearGradient>
    <linearGradient id="urfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#c8ecf8"/>
      <stop offset="100%" style="stop-color:#6dd4f0"/>
    </linearGradient>
    <linearGradient id="sharedS" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%"   style="stop-color:#5ba4c7"/>
      <stop offset="45%"  style="stop-color:#7dc4e0"/>
      <stop offset="100%" style="stop-color:#c8ecf8"/>
    </linearGradient>
  </defs>

  <text x="0" y="52"
        font-family="'Courier New', Courier, monospace"
        font-size="60" font-weight="700"
        fill="url(#kairoGrad)" letter-spacing="-1">KAIRO</text>

  <text x="175" y="52"
        font-family="'Courier New', Courier, monospace"
        font-size="60" font-weight="700"
        fill="url(#sharedS)">S</text>

  <text x="213" y="52"
        font-family="'Courier New', Courier, monospace"
        font-size="60" font-weight="700"
        fill="url(#urfGrad)" letter-spacing="-1">URF</text>
</svg>`;

interface KairoWordmarkProps {
  height?: number;
}

export function KairoWordmark({ height = 20 }: KairoWordmarkProps) {
  // Preserve aspect ratio (460:72)
  const width = (height / 72) * 460;
  return <SvgXml xml={WORDMARK_SVG} width={width} height={height} />;
}

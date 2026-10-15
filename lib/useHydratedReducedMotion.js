'use client';

import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
const serverSnapshot = () => false;
const browserSnapshot = () => window.matchMedia(query).matches;

function subscribe(onChange) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

// React reuses the server snapshot for the first hydration render, then reads
// the real browser preference. Initial Motion styles therefore match the HTML.
export default function useHydratedReducedMotion() {
  return useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
}

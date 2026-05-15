'use client';

import { useEffect, useRef, useState } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptLoading = false;
let scriptLoaded = false;
const loadCallbacks = [];

function loadScript() {
  return new Promise((resolve) => {
    if (scriptLoaded) return resolve();
    loadCallbacks.push(resolve);
    if (scriptLoading) return;
    scriptLoading = true;
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      scriptLoaded = true;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };
    document.head.appendChild(s);
  });
}

export default function Turnstile({ onVerify }) {
  const containerRef = useRef(null);
  const widgetIdRef  = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) { setFailed(true); return; }

    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !containerRef.current) return;

      // Wait for window.turnstile to be available
      const tryRender = (attempts = 0) => {
        if (cancelled) return;
        if (!window.turnstile) {
          if (attempts > 20) { setFailed(true); return; }
          setTimeout(() => tryRender(attempts + 1), 100);
          return;
        }
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            callback: (token) => onVerify?.(token),
            'error-callback': () => setFailed(true),
            'expired-callback': () => onVerify?.(''),
            theme: 'light',
            size: 'flexible',
          });
        } catch {
          setFailed(true);
        }
      };
      tryRender();
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
    };
  }, [onVerify]);

  // If Turnstile fails to load, allow user to proceed (fail-open for accessibility)
  useEffect(() => {
    if (failed) {
      onVerify?.('SKIP');
    }
  }, [failed, onVerify]);

  if (!SITE_KEY || failed) return null;

  return <div ref={containerRef} className="flex justify-center min-h-[65px]" />;
}

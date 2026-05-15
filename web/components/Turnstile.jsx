'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Turnstile({ onVerify, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef  = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.turnstile || !SITE_KEY) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token) => onVerify?.(token),
      'error-callback': () => onError?.(),
      'expired-callback': () => onVerify?.(null),
      theme: 'light',
      size: 'flexible',
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch {}
      }
    };
  }, [ready, onVerify, onError]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async defer
        onLoad={() => setReady(true)}
        onReady={() => setReady(true)}
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}

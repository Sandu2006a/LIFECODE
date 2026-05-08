'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lc_cookie_consent');
    if (!consent) setTimeout(() => setVisible(true), 1200);
  }, []);

  const accept = () => { localStorage.setItem('lc_cookie_consent', 'accepted'); setVisible(false); };
  const decline = () => { localStorage.setItem('lc_cookie_consent', 'declined'); setVisible(false); };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: '#111111', color: '#ffffff', borderRadius: '12px',
      padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)', maxWidth: '640px',
      width: 'calc(100% - 48px)', flexWrap: 'wrap',
    }}>
      <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0, flex: 1, minWidth: '200px', color: '#d0d0d0' }}>
        We use cookies to improve your experience.{' '}
        <Link href="/privacy" style={{ color: '#ffffff', textDecoration: 'underline' }}>Privacy Policy</Link>
      </p>
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button onClick={decline} style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>
          Decline
        </button>
        <button onClick={accept} style={{ background: '#ffffff', border: 'none', color: '#111111', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Accept
        </button>
      </div>
    </div>
  );
}

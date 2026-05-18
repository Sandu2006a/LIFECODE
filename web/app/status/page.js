// Pure-HTML fallback page that bypasses Cloudflare bot detection on
// restrictive networks (university WiFi, corporate proxies).
// No JavaScript, no React Server Components, no client-side anything.
// Stays cached aggressively at Cloudflare's edge.

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata = {
  title: 'LIFECODE — Status',
  description: 'Static fallback page. If you can read this on TUe WiFi, the network can reach our server.',
};

export default function StatusPage() {
  return (
    <html lang="en" style={{ background: '#F7F7F5', color: '#0A0A0B' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="robots" content="index,follow" />
      </head>
      <body style={{
        margin: 0, padding: '48px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        maxWidth: 640, marginLeft: 'auto', marginRight: 'auto',
        lineHeight: 1.55,
      }}>
        <h1 style={{ fontSize: 32, letterSpacing: -1, marginBottom: 12 }}>LIFECODE</h1>
        <p style={{ color: '#0A0A0B', opacity: 0.6, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginTop: 0 }}>System status</p>

        <p style={{ marginTop: 32 }}>
          ✓ <strong>Server reachable.</strong> If you can see this page, your network can talk to lifecodenutrition.com.
        </p>

        <p>
          The main site is JavaScript-heavy and may be challenged by aggressive firewall / bot-protection on
          some networks (universities, hospitals, corporate proxies). This page is plain HTML — it always loads.
        </p>

        <h2 style={{ fontSize: 18, marginTop: 32 }}>If the main site doesn&apos;t load on this network</h2>
        <ul style={{ paddingLeft: 18 }}>
          <li>Try a different DNS (settings → WiFi → DNS): <code>1.1.1.1</code> or <code>8.8.8.8</code></li>
          <li>Try Cloudflare WARP (free): <a href="https://1.1.1.1/" style={{ color: '#4F46E5' }}>1.1.1.1</a></li>
          <li>Or temporarily switch to mobile data</li>
        </ul>

        <h2 style={{ fontSize: 18, marginTop: 32 }}>Get the app</h2>
        <p>
          The mobile app works without the website. Open Expo Go and scan the activation code from your email.
        </p>

        <hr style={{ border: 0, borderTop: '1px solid rgba(10,10,11,0.08)', margin: '40px 0' }} />
        <p style={{ fontSize: 12, color: 'rgba(10,10,11,0.5)' }}>
          LIFECODE · Static fallback page · <a href="/" style={{ color: 'inherit' }}>→ Try the full site</a>
        </p>
      </body>
    </html>
  );
}

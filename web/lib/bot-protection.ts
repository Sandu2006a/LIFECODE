// Reusable bot protection utilities

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!token) return false;
  if (token === 'SKIP') return true; // widget failed to load on client, fall back to other protections
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // if not configured, skip verification

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);
    formData.append('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}


export const BLOCKED_DOMAINS = new Set([
  // Caught spamming Lifecode
  'mailrez.com','rezult.org','linksandmail.com','clientcaf.info','webmai.co',
  'banlamail.com','ourtimesupport.com','wirethings.net','zebyinbox.com',
  // Common disposable/temporary email services
  'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com',
  'throwaway.email','yopmail.com','sharklasers.com','guerrillamailblock.com',
  'grr.la','guerrillamail.info','guerrillamail.biz','guerrillamail.de',
  'spam4.me','trashmail.com','trashmail.me','dispostable.com','mailnull.com',
  'spamgourmet.com','mailnesia.com','maildrop.cc','discard.email',
  'getnada.com','nada.email','temp-mail.org','emailondeck.com',
  'fakeinbox.com','fakemail.net','tempinbox.com','tempm.com',
  'mintemail.com','mohmal.com','tempmailo.com','tempmail.net',
  'temp-mail.io','minuteinbox.com','mailfa.tk','tempmail.ninja',
  'tempinbox.xyz','tempmail.email','disposable.email',
]);

// Suspicious TLDs often used by bots
const SUSPICIOUS_TLDS = ['.info', '.xyz', '.top', '.click', '.online', '.site', '.live'];

// Common bot name patterns (Faker library outputs)
const FAKER_FIRST_NAMES = [
  'tyree','myrtis','leone','destinee','craig','dayana','jaden','chauncey',
  'newell','sierra','leopoldo','alisha','wilton','brendon','cornelia',
  'lenna','vena','natalie','roderick','eino','zena','vandervort',
];

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; reset: number }>();

export function isRateLimited(ip: string, maxRequests = 3, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  if (entry.count >= maxRequests) return true;
  entry.count++;
  return false;
}

export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getEmailDomain(email: string): string {
  return email.toLowerCase().split('@')[1] || '';
}

export function isBlockedDomain(email: string): boolean {
  return BLOCKED_DOMAINS.has(getEmailDomain(email));
}

export function looksLikeBotName(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  // Check if name matches typical Faker output patterns
  return FAKER_FIRST_NAMES.some(faker => lower.includes(faker));
}

export interface BotCheckOptions {
  email: string;
  honeypot?: string;
  name?: string;
  ip: string;
  maxRequests?: number;
}

export interface BotCheckResult {
  blocked: boolean;
  silentReject: boolean; // For honeypot — return success to deceive bot
  reason?: string;
  status?: number;
}

export function checkForBot(opts: BotCheckOptions): BotCheckResult {
  // 1. Honeypot — silently accept bot but don't save
  if (opts.honeypot) {
    return { blocked: true, silentReject: true };
  }

  // 2. Rate limit by IP
  if (isRateLimited(opts.ip, opts.maxRequests || 3)) {
    return { blocked: true, silentReject: false, reason: 'Too many requests. Try again later.', status: 429 };
  }

  // 3. Email validation
  if (!opts.email || !isValidEmail(opts.email)) {
    return { blocked: true, silentReject: false, reason: 'Invalid email address.', status: 400 };
  }

  // 4. Blocked disposable domains
  if (isBlockedDomain(opts.email)) {
    return { blocked: true, silentReject: false, reason: 'Please use a valid email address.', status: 400 };
  }

  // 5. Suspicious bot name pattern
  if (opts.name && looksLikeBotName(opts.name)) {
    return { blocked: true, silentReject: false, reason: 'Invalid request.', status: 400 };
  }

  return { blocked: false, silentReject: false };
}

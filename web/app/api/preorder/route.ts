import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const TOTAL_SPOTS = 157;

// Blocked disposable/spam domains
const BLOCKED_DOMAINS = new Set([
  'mailrez.com','rezult.org','linksandmail.com','clientcaf.info','webmai.co',
  'banlamail.com','ourtimesupport.com','wirethings.net','zebyinbox.com',
  'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com',
  'throwaway.email','yopmail.com','sharklasers.com','guerrillamailblock.com',
  'grr.la','guerrillamail.info','guerrillamail.biz','guerrillamail.de',
  'spam4.me','trashmail.com','trashmail.me','dispostable.com','mailnull.com',
  'spamgourmet.com','mailnesia.com','maildrop.cc','discard.email',
]);

// Simple in-memory rate limiter (per IP, max 3 per 10 min)
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

async function countTaken(): Promise<number> {
  try {
    const { count, error } = await admin()
      .from('preorders')
      .select('id', { count: 'exact', head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function getFirstName(email: string): string {
  const local = email.split('@')[0];
  const cleaned = local.replace(/[^a-zA-Z]/g, ' ').trim().split(' ')[0];
  if (!cleaned) return 'there';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

function welcomeEmailHtml(email: string) {
  const firstName = getFirstName(email);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Welcome to Lifecode</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:60px 16px;">
    <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

      <tr><td style="padding-bottom:48px;">
        <p style="margin:0;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#bbb;font-family:Arial,sans-serif;">LIFECODE</p>
      </td></tr>

      <tr><td style="padding-bottom:32px;">
        <p style="margin:0;font-size:18px;color:#0a0a0a;line-height:1.8;">Hey ${firstName},</p>
      </td></tr>

      <tr><td style="padding-bottom:32px;">
        <p style="margin:0 0 20px;font-size:18px;color:#0a0a0a;line-height:1.8;font-weight:700;">
          Welcome to Lifecode. 🧬
        </p>
        <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.8;">
          Really glad you are here.
        </p>
        <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.8;">
          Quick question — what made you sign up?
        </p>
        <p style="margin:0;font-size:16px;color:#333;line-height:1.8;">
          Hit reply and tell us. We read every message.
        </p>
      </td></tr>

      <tr><td style="padding:32px 0;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;">
        <p style="margin:0;font-size:15px;color:#666;line-height:1.8;">
          — The Lifecode Team 🧬
        </p>
      </td></tr>

      <tr><td style="padding-top:32px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#ccc;font-family:Arial,sans-serif;">
          <a href="https://lifecodenutrition.com" style="color:#ccc;text-decoration:none;">lifecodenutrition.com</a>
          &nbsp;·&nbsp;
          <a href="mailto:hello@lifecodenutrition.com" style="color:#ccc;text-decoration:none;">hello@lifecodenutrition.com</a>
        </p>
      </td></tr>

    </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function GET() {
  const taken = await countTaken();
  const remaining = Math.max(0, TOTAL_SPOTS - taken);
  return NextResponse.json({ remaining, total: TOTAL_SPOTS, taken });
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await req.json() as { email?: string; _hp?: string };

    // Honeypot — bots fill hidden fields, humans don't
    if (body._hp) {
      return NextResponse.json({ success: true }); // silently ignore bots
    }

    const { email } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    const normal = email.toLowerCase().trim();

    // Block disposable/spam domains
    const domain = normal.split('@')[1];
    if (BLOCKED_DOMAINS.has(domain)) {
      return NextResponse.json({ error: 'Please use a valid email address.' }, { status: 400 });
    }

    const taken = await countTaken();
    if (taken >= TOTAL_SPOTS) {
      return NextResponse.json(
        { error: 'All founders spots have been taken.', remaining: 0, total: TOTAL_SPOTS },
        { status: 410 }
      );
    }

    const { error } = await admin()
      .from('preorders')
      .insert({ email: normal, source: 'home' });

    let alreadyOnList = false;
    if (error) {
      if ((error as any).code === '23505') {
        alreadyOnList = true;
      } else {
        console.error('preorder insert error:', error);
        return NextResponse.json({ error: "Couldn't save right now. Try again." }, { status: 500 });
      }
    }

    // Send welcome email — capture error details so we can surface them
    let mailDebug: any = { sent: false };
    try {
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'Lifecode <hello@lifecodenutrition.com>';
      mailDebug.from = fromAddress;
      const result = await getResend().emails.send({
        from: fromAddress,
        to: normal,
        replyTo: 'hello@lifecodenutrition.com',
        subject: 'Welcome to Lifecode 🧬',
        html: welcomeEmailHtml(normal),
      });
      mailDebug.sent = true;
      mailDebug.id = (result as any)?.data?.id ?? null;
      mailDebug.resendError = (result as any)?.error ?? null;
    } catch (mailErr: any) {
      console.error('preorder email error:', mailErr);
      mailDebug.exception = mailErr?.message || String(mailErr);
    }

    const remaining = Math.max(0, TOTAL_SPOTS - (alreadyOnList ? taken : taken + 1));
    return NextResponse.json({
      success: true,
      alreadyOnList,
      remaining,
      total: TOTAL_SPOTS,
      mailDebug,
    });
  } catch (err: any) {
    console.error('preorder route error:', err);
    return NextResponse.json({ error: err?.message || 'Server error.' }, { status: 500 });
  }
}

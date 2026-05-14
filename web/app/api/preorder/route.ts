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
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Inter',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 16px;">
    <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.04);">

      <!-- Gradient top bar -->
      <tr><td style="height:4px;background:linear-gradient(90deg,#FF8A00 0%,#C62828 40%,#7C3AED 70%,#1D4ED8 100%);"></td></tr>

      <!-- Logo -->
      <tr><td style="padding:48px 48px 0;">
        <p style="margin:0;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:#bbb;font-weight:700;font-family:'Inter',Arial,sans-serif;">LIFECODE</p>
      </td></tr>

      <!-- Greeting -->
      <tr><td style="padding:32px 48px 0;">
        <p style="margin:0;font-size:18px;color:#0a0a0a;font-family:'Playfair Display',Georgia,serif;font-style:italic;">Hey ${firstName},</p>
      </td></tr>

      <!-- Main message -->
      <tr><td style="padding:24px 48px 0;">
        <h1 style="margin:0 0 8px;font-size:34px;line-height:1.15;color:#0a0a0a;font-family:'Playfair Display',Georgia,serif;font-weight:700;letter-spacing:-0.5px;">
          Welcome to Lifecode.
        </h1>
        <p style="margin:16px 0 0;font-size:16px;color:#555;line-height:1.7;font-family:'Inter',Arial,sans-serif;">
          Really glad you are here. 🧬
        </p>
      </td></tr>

      <!-- Quote / Motivational message -->
      <tr><td style="padding:36px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid transparent;border-image:linear-gradient(180deg,#FF8A00,#C62828,#7C3AED) 1;background:linear-gradient(90deg,rgba(255,138,0,0.04),rgba(124,58,237,0.04));">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0;font-size:18px;line-height:1.5;color:#0a0a0a;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:400;">
              "The work you do when no one is watching is what determines what you become."
            </p>
            <p style="margin:12px 0 0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#999;font-family:'Inter',Arial,sans-serif;">
              Why we built this
            </p>
          </td></tr>
        </table>
      </td></tr>

      <!-- Story / Mission -->
      <tr><td style="padding:32px 48px 0;">
        <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.8;font-family:'Inter',Arial,sans-serif;">
          You signed up because something about this resonated. Maybe it was the science. Maybe the transparency. Maybe just the feeling that finally, someone built it the way it should have been built from the start.
        </p>
        <p style="margin:0;font-size:15px;color:#444;line-height:1.8;font-family:'Inter',Arial,sans-serif;">
          We want to know which one it was.
        </p>
      </td></tr>

      <!-- Ask -->
      <tr><td style="padding:32px 48px 0;">
        <div style="background:linear-gradient(135deg,#FFF8F5,#FAF7FF);border-radius:12px;padding:24px;">
          <p style="margin:0 0 8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#C62828;font-weight:700;font-family:'Inter',Arial,sans-serif;">
            One quick question
          </p>
          <p style="margin:0 0 12px;font-size:20px;color:#0a0a0a;font-family:'Playfair Display',Georgia,serif;font-weight:600;line-height:1.4;">
            What made you sign up?
          </p>
          <p style="margin:0;font-size:14px;color:#666;line-height:1.7;font-family:'Inter',Arial,sans-serif;">
            Hit reply and tell us. We read every single message — and the answers shape what we build next.
          </p>
        </div>
      </td></tr>

      <!-- Signature -->
      <tr><td style="padding:40px 48px 32px;">
        <p style="margin:0;font-size:15px;color:#666;line-height:1.6;font-family:'Playfair Display',Georgia,serif;font-style:italic;">
          — The Lifecode Team 🧬
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 48px 32px;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:11px;color:#bbb;line-height:1.8;text-align:center;font-family:'Inter',Arial,sans-serif;letter-spacing:0.3px;">
          <a href="https://lifecodenutrition.com" style="color:#999;text-decoration:none;font-weight:500;">lifecodenutrition.com</a>
          &nbsp;·&nbsp;
          <a href="mailto:hello@lifecodenutrition.com" style="color:#999;text-decoration:none;font-weight:500;">hello@lifecodenutrition.com</a>
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

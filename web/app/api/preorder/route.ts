import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { verifyTurnstile, getClientIp } from '@/lib/bot-protection';

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
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Inter',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:48px 16px;">
    <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.04);">

      <!-- Gradient top bar -->
      <tr><td style="height:4px;background:linear-gradient(90deg,#FF8A00 0%,#C62828 40%,#7C3AED 70%,#1D4ED8 100%);"></td></tr>

      <!-- Logo -->
      <tr><td style="padding:48px 48px 0;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:10px;vertical-align:middle;">
            <img src="https://lifecodenutrition.com/logo.png" width="32" height="32" alt="" style="display:block;width:32px;height:32px;"/>
          </td>
          <td style="vertical-align:middle;">
            <span style="font-size:14px;letter-spacing:6px;text-transform:uppercase;font-weight:800;font-family:'Barlow Condensed','Inter',Arial,sans-serif;background:linear-gradient(135deg,#FF8A00 0%,#C62828 40%,#7C3AED 70%,#1D4ED8 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#C62828;">LIFECODE</span>
          </td>
        </tr></table>
      </td></tr>

      <!-- Greeting -->
      <tr><td style="padding:32px 48px 0;">
        <p style="margin:0;font-size:16px;color:#666;font-family:'Inter',Arial,sans-serif;font-weight:400;">Hey ${firstName},</p>
      </td></tr>

      <!-- Main message -->
      <tr><td style="padding:16px 48px 0;">
        <h1 style="margin:0;font-size:42px;line-height:1.05;color:#0a0a0a;font-family:'Barlow Condensed','Inter',Arial,sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
          Welcome to<br/>
          <span style="background:linear-gradient(135deg,#FF8A00 0%,#C62828 40%,#7C3AED 70%,#1D4ED8 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#C62828;">Lifecode.</span>
        </h1>
        <p style="margin:20px 0 0;font-size:15px;color:#555;line-height:1.7;font-family:'Inter',Arial,sans-serif;font-weight:400;">
          Really glad you are here. 🧬
        </p>
      </td></tr>

      <!-- Quote / Motivational message -->
      <tr><td style="padding:36px 48px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:14px;">
          <tr><td style="padding:28px;">
            <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:800;font-family:'Barlow Condensed','Inter',Arial,sans-serif;background:linear-gradient(90deg,#FF8A00,#E8445A,#7C3AED);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#FF8A00;">
              Why we built this
            </p>
            <p style="margin:0;font-size:20px;line-height:1.4;color:#ffffff;font-family:'Barlow Condensed','Inter',Arial,sans-serif;font-weight:600;letter-spacing:0.3px;">
              "The work you do when no one is watching is what determines what you become."
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
        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;background:linear-gradient(135deg,#FFF9F5 0%,#FFF3EC 40%,#F8F5FF 100%);border:1px solid rgba(232,68,90,0.15);">
          <tr><td style="padding:28px;">
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:800;font-family:'Barlow Condensed','Inter',Arial,sans-serif;background:linear-gradient(90deg,#FF8A00,#E8445A,#7C3AED);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#E8445A;">
              One quick question
            </p>
            <p style="margin:0 0 14px;font-size:26px;color:#0a0a0a;font-family:'Barlow Condensed','Inter',Arial,sans-serif;font-weight:700;line-height:1.1;text-transform:uppercase;letter-spacing:0.5px;">
              What made you<br/>sign up?
            </p>
            <p style="margin:0;font-size:14px;color:#555;line-height:1.7;font-family:'Inter',Arial,sans-serif;font-weight:400;">
              Hit reply and tell us. We read every single message — and the answers shape what we build next.
            </p>
          </td></tr>
        </table>
      </td></tr>

      <!-- Signature -->
      <tr><td style="padding:40px 48px 32px;">
        <p style="margin:0;font-size:13px;color:#666;line-height:1.6;font-family:'Inter',Arial,sans-serif;font-weight:500;letter-spacing:0.3px;">
          — The Lifecode Team 🧬
        </p>
      </td></tr>

      <!-- Social + Footer -->
      <tr><td style="padding:24px 48px 32px;border-top:1px solid #f0f0f0;text-align:center;">
        <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 16px;">
          <tr>
            <td style="padding:0 6px;">
              <a href="https://www.instagram.com/lifecodenutrition" style="display:inline-block;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#FF8A00,#C62828,#7C3AED);text-decoration:none;text-align:center;">
                <img src="https://cdn.simpleicons.org/instagram/white" width="16" height="16" alt="Instagram" style="display:inline-block;margin-top:10px;vertical-align:middle;"/>
              </a>
            </td>
            <td style="padding:0 6px;">
              <a href="https://www.facebook.com/lifecodenutrition" style="display:inline-block;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#FF8A00,#C62828,#7C3AED);text-decoration:none;text-align:center;">
                <img src="https://cdn.simpleicons.org/facebook/white" width="16" height="16" alt="Facebook" style="display:inline-block;margin-top:10px;vertical-align:middle;"/>
              </a>
            </td>
            <td style="padding:0 6px;">
              <a href="https://www.tiktok.com/@lifecode.nutrition" style="display:inline-block;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#FF8A00,#C62828,#7C3AED);text-decoration:none;text-align:center;">
                <img src="https://cdn.simpleicons.org/tiktok/white" width="16" height="16" alt="TikTok" style="display:inline-block;margin-top:10px;vertical-align:middle;"/>
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:11px;color:#bbb;line-height:1.8;font-family:'Inter',Arial,sans-serif;letter-spacing:0.3px;">
          <a href="https://lifecodenutrition.com" style="color:#999;text-decoration:none;font-weight:500;">lifecodenutrition.com</a>
          &nbsp;·&nbsp;
          <a href="mailto:lifecodenutrition@gmail.com" style="color:#999;text-decoration:none;font-weight:500;">lifecodenutrition@gmail.com</a>
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

    const body = await req.json() as { email?: string; _hp?: string; turnstileToken?: string };

    // Honeypot — bots fill hidden fields, humans don't
    if (body._hp) {
      return NextResponse.json({ success: true }); // silently ignore bots
    }

    // Turnstile verification
    const turnstileOk = await verifyTurnstile(body.turnstileToken, getClientIp(req));
    if (!turnstileOk) {
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 });
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

    // Send welcome email to user
    let mailDebug: any = { sent: false };
    try {
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'Lifecode <lifecodenutrition@gmail.com>';
      mailDebug.from = fromAddress;
      const result = await getResend().emails.send({
        from: fromAddress,
        to: normal,
        replyTo: 'lifecodenutrition@gmail.com',
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

    // Send notification to admin (only for new signups)
    if (!alreadyOnList) {
      try {
        const totalCount = taken + 1;
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Lifecode <lifecodenutrition@gmail.com>',
          to: 'lifecodenutrition@gmail.com',
          replyTo: normal,
          subject: `🧬 New pre-order signup: ${normal}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
              <p style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#999;margin:0 0 24px;">LIFECODE · New Signup</p>
              <h2 style="font-size:22px;font-weight:800;color:#0a0a0a;margin:0 0 16px;">${normal}</h2>
              <p style="font-size:14px;color:#666;line-height:1.8;margin:0;">
                <strong>Source:</strong> home page<br/>
                <strong>Timestamp:</strong> ${new Date().toISOString()}<br/>
                <strong>Total signups:</strong> ${totalCount}
              </p>
              <p style="margin:24px 0 0;font-size:13px;color:#888;">Hit reply to send them a message.</p>
            </div>
          `,
        });
      } catch (notifErr) {
        console.error('admin notification error:', notifErr);
      }
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

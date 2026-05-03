import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const TOTAL_SPOTS = 157;

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

function welcomeEmailHtml(email: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-zeta-lyart-53.vercel.app';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>You're on the LIFECODE founders list</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:48px 16px;">
    <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">

      <tr><td style="text-align:center;padding-bottom:36px;">
        <p style="margin:0;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:#999;font-weight:700;">LIFECODE</p>
      </td></tr>

      <tr><td style="text-align:center;padding-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C62828;font-weight:700;">
          Founders list · Confirmed
        </p>
        <h1 style="margin:0;font-size:38px;font-weight:800;color:#0a0a0a;line-height:1.05;letter-spacing:-1px;">
          You're in.<br/>
          <span style="background:linear-gradient(90deg,#FF8A00,#C62828,#7C3AED);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#C62828;">
            The protocol is coming.
          </span>
        </h1>
        <p style="margin:18px 0 0;font-size:15px;color:#666;line-height:1.7;">
          We saved your spot on the founders list. The doors open soon —
          and you'll be the first one through them.
        </p>
      </td></tr>

      <tr><td style="text-align:center;padding:28px 0 36px;">
        <div style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#FFF3EC 0%,#FFE8D6 100%);border:1.5px solid #E8631A;">
          <span style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#C62828;font-weight:800;">
            Coming soon · Pre-order opens shortly
          </span>
        </div>
      </td></tr>

      <tr><td style="padding:0 0 32px;">
        <div style="border-top:1px solid #f0f0f0;"></div>
      </td></tr>

      <tr><td style="padding-bottom:36px;">
        <h2 style="margin:0 0 14px;font-size:20px;font-weight:800;color:#0a0a0a;line-height:1.3;letter-spacing:-0.3px;">
          One percent. Every day. For the rest of your life.
        </h2>
        <p style="margin:0;font-size:14px;color:#666;line-height:1.8;">
          You didn't sign up for "average." You signed up because you train when no one's watching,
          because the next session matters more than the last one,
          and because you know <strong style="color:#0a0a0a;">your body deserves a real protocol —
          not another shelf of bottles.</strong>
        </p>
        <p style="margin:14px 0 0;font-size:14px;color:#666;line-height:1.8;">
          That's exactly what we built. And you're going to be one of the first to live it.
        </p>
      </td></tr>

      <tr><td style="padding:0 0 36px;">
        <div style="border-top:1px solid #f0f0f0;"></div>
      </td></tr>

      <tr><td style="padding-bottom:32px;">
        <p style="margin:0 0 18px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#bbb;font-weight:700;">
          What being on the founders list means
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr>
            <td width="44" valign="top">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#FF8A00,#C62828);text-align:center;line-height:32px;font-size:13px;font-weight:800;color:#fff;">−25%</div>
            </td>
            <td style="padding-left:14px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0a0a0a;">Founder pricing — locked in for life</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">A discount only the first wave will ever get. It never resets.</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr>
            <td width="44" valign="top">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#C62828,#7C3AED);text-align:center;line-height:32px;font-size:13px;font-weight:800;color:#fff;">1ST</div>
            </td>
            <td style="padding-left:14px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0a0a0a;">Priority shipping — before everyone</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Our first production run goes to founders. Public launch comes after.</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="44" valign="top">
              <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7C3AED,#1D4ED8);text-align:center;line-height:32px;font-size:11px;font-weight:800;color:#fff;">$0</div>
            </td>
            <td style="padding-left:14px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0a0a0a;">Zero commitment now</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">No card, no charge. Just a head start when pre-orders open.</p>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:0 0 32px;">
        <div style="border-top:1px solid #f0f0f0;"></div>
      </td></tr>

      <tr><td style="text-align:center;padding-bottom:32px;">
        <p style="margin:0 0 16px;font-size:13px;color:#777;line-height:1.7;font-style:italic;">
          "Most people quit when it stops being convenient.<br/>
          The ones who don't, build something different."
        </p>
        <a href="${siteUrl}"
           style="display:inline-block;padding:14px 36px;border-radius:999px;
                  background:linear-gradient(135deg,#FF8A00 0%,#C62828 50%,#7C3AED 100%);
                  color:#ffffff;text-decoration:none;
                  font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">
          Visit lifecode →
        </a>
      </td></tr>

      <tr><td style="border-top:1px solid #f0f0f0;padding-top:24px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#bbb;line-height:2;">
          LIFECODE · Founders List · ${email}<br/>
          <a href="mailto:hello@lifecode.app" style="color:#bbb;text-decoration:none;">hello@lifecode.app</a>
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
    const { email } = await req.json() as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    const normal = email.toLowerCase().trim();

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
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'LIFECODE <onboarding@resend.dev>';
      const hasKey = !!process.env.RESEND_API_KEY;
      mailDebug.from = fromAddress;
      mailDebug.hasKey = hasKey;
      const result = await getResend().emails.send({
        from: fromAddress,
        to: normal,
        subject: alreadyOnList
          ? "You're already on the LIFECODE founders list"
          : "You're in. The protocol is coming.",
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

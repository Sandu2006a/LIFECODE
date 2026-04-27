import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

function emailHtml(plan: string, magicLink: string) {
  const isProtocol = plan === 'protocol';
  const accentColor = isProtocol ? '#C62828' : '#E8631A';
  const planLabel = isProtocol ? 'Protocol' : 'Essentials';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to LIFECODE</title></head>
<body style="margin:0;padding:0;background:#fafaf7;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:48px 24px;">
    <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#bbb;margin-bottom:48px;">LIFECODE</p>
    <h1 style="font-size:36px;font-weight:700;color:#0d0d0f;line-height:1.1;margin:0 0 16px;">
      Welcome to<br/>the Protocol.
    </h1>
    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 36px;">
      You're in. Your <strong style="color:${accentColor}">${planLabel}</strong> access is active —
      free while we finalise pricing. Download the LIFECODE app and activate your account below.
    </p>

    <!-- CTA -->
    <a href="${magicLink}"
       style="display:inline-block;background:${accentColor};color:#fff;text-decoration:none;
              font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;
              padding:16px 36px;border-radius:999px;margin-bottom:12px;">
      Activate my account →
    </a>
    <p style="font-size:11px;color:#bbb;margin:0 0 48px;">
      Link expires in 24 hours. One click — no password needed yet.
    </p>

    <!-- App download -->
    <div style="border:1px solid #ede0e0;border-radius:16px;padding:24px;margin-bottom:48px;">
      <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#bbb;margin:0 0 12px;">LIFECODE APP</p>
      <p style="font-size:14px;color:#333;margin:0 0 4px;font-weight:600;">Download on Expo Go</p>
      <p style="font-size:13px;color:#888;margin:0 0 16px;line-height:1.6;">
        Search <strong>LIFECODE</strong> in Expo Go, or scan the QR code in our app listing.
        Log in with this email to unlock your protocol.
      </p>
      <p style="font-size:12px;color:#bbb;margin:0;">
        iOS · Android — full App Store launch coming soon
      </p>
    </div>

    <p style="font-size:12px;color:#ccc;text-align:center;margin:0;">
      LIFECODE · Protocol Members Only<br/>
      <a href="mailto:hello@lifecode.app" style="color:#bbb;">hello@lifecode.app</a>
    </p>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, plan = 'protocol' } = await req.json() as { email: string; plan?: string };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
    }

    const normalEmail = email.toLowerCase().trim();

    // Check if user already exists
    const { data: existing } = await getAdminSupabase()
      .from('profiles')
      .select('id')
      .eq('email', normalEmail)
      .maybeSingle();

    let userId: string;

    if (existing) {
      userId = existing.id;
    } else {
      // Create new user
      const { data: created, error: createErr } = await getAdminSupabase().auth.admin.createUser({
        email: normalEmail,
        email_confirm: true,
        user_metadata: { plan },
      });
      if (createErr || !created.user) {
        return NextResponse.json({ error: createErr?.message ?? 'Could not create account.' }, { status: 500 });
      }
      userId = created.user.id;
    }

    // Grant free protocol-level access
    await getAdminSupabase().from('app_access').upsert({
      user_id: userId,
      access_level: plan === 'essentials' ? 'basic' : 'protocol',
      is_active: true,
      reason: 'early_access',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Generate magic link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-zeta-lyart-53.vercel.app';
    const { data: linkData, error: linkErr } = await getAdminSupabase().auth.admin.generateLink({
      type: 'magiclink',
      email: normalEmail,
      options: { redirectTo: `${siteUrl}/dashboard` },
    });

    const magicLink = (linkData as any)?.properties?.action_link ?? `${siteUrl}/login`;

    // Send email via Resend
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'LIFECODE <onboarding@resend.dev>';
    try {
      await getResend().emails.send({
        from: fromAddress,
        to: normalEmail,
        subject: 'Your LIFECODE Protocol is ready.',
        html: emailHtml(plan, magicLink),
      });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      // Don't fail the registration if email fails
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('register error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

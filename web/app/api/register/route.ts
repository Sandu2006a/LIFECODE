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

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function emailHtml(plan: string, magicLink: string, activationCode: string, userEmail: string, userName: string) {
  const firstName = userName.split(' ')[0] || 'Athlete';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-zeta-lyart-53.vercel.app';
  const productImg = `${siteUrl}/Cutie_deschisa.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Welcome to LIFECODE</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:48px 16px;">
    <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">

      <!-- BRAND -->
      <tr><td style="text-align:center;padding-bottom:40px;">
        <p style="margin:0;font-size:11px;letter-spacing:6px;text-transform:uppercase;color:#999;font-weight:600;">LIFECODE</p>
      </td></tr>

      <!-- GREETING -->
      <tr><td style="text-align:center;padding-bottom:32px;">
        <p style="margin:0 0 6px;font-size:13px;color:#aaa;letter-spacing:0.5px;">Hey ${firstName},</p>
        <h1 style="margin:0;font-size:36px;font-weight:700;color:#111111;line-height:1.1;letter-spacing:-0.5px;">
          Your Protocol<br/>is ready.
        </h1>
        <p style="margin:16px 0 0;font-size:15px;color:#666;line-height:1.7;">
          You're in. Early access, no credit card required.
        </p>
      </td></tr>

      <!-- PRODUCT IMAGE -->
      <tr><td style="text-align:center;padding:0 0 40px;">
        <img src="${productImg}" width="320" alt="LIFECODE Protocol"
             style="width:100%;max-width:320px;height:auto;display:block;margin:0 auto;"/>
      </td></tr>

      <!-- CTA -->
      <tr><td style="text-align:center;padding-bottom:48px;">
        <a href="${magicLink}"
           style="display:inline-block;padding:16px 44px;border-radius:999px;
                  background:linear-gradient(135deg,#E8631A 0%,#C62828 100%);
                  color:#ffffff;text-decoration:none;
                  font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">
          Activate my account →
        </a>
        <p style="margin:12px 0 0;font-size:11px;color:#bbb;">Link expires in 24 hours</p>
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="padding:0 0 40px;">
        <div style="border-top:1px solid #f0f0f0;"></div>
      </td></tr>

      <!-- ACTIVATION CODE -->
      <tr><td style="text-align:center;padding-bottom:48px;">
        <p style="margin:0 0 20px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#bbb;font-weight:600;">App activation code</p>
        <table cellpadding="0" cellspacing="8" style="margin:0 auto;">
          <tr>
            ${activationCode.split('').map(ch => `
            <td style="width:52px;height:64px;text-align:center;vertical-align:middle;
                        border-radius:12px;
                        background:linear-gradient(135deg,#FFF3EC 0%,#FFE8D6 100%);
                        border:1.5px solid #E8631A;">
              <span style="font-size:28px;font-weight:800;color:#C62828;
                            font-family:'Courier New',Courier,monospace;
                            letter-spacing:0;">${ch}</span>
            </td>`).join('')}
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#bbb;line-height:1.6;">
          Enter this code in the LIFECODE app to unlock your protocol
        </p>
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="padding:0 0 40px;">
        <div style="border-top:1px solid #f0f0f0;"></div>
      </td></tr>

      <!-- STEPS -->
      <tr><td style="padding-bottom:48px;">
        <p style="margin:0 0 24px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#bbb;font-weight:600;text-align:center;">Getting started</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
          <tr>
            <td width="36" valign="top">
              <div style="width:26px;height:26px;border-radius:50%;
                          background:linear-gradient(135deg,#E8631A,#C62828);
                          text-align:center;line-height:26px;font-size:11px;font-weight:700;color:#fff;">1</div>
            </td>
            <td style="padding-left:14px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#111;">Download Expo Go</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">App Store or Google Play — search <strong>Expo Go</strong></p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
          <tr>
            <td width="36" valign="top">
              <div style="width:26px;height:26px;border-radius:50%;
                          background:linear-gradient(135deg,#E8631A,#C62828);
                          text-align:center;line-height:26px;font-size:11px;font-weight:700;color:#fff;">2</div>
            </td>
            <td style="padding-left:14px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#111;">Activate your account</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Tap <strong style="color:#C62828;">Activate my account</strong> above to set your password</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="36" valign="top">
              <div style="width:26px;height:26px;border-radius:50%;
                          background:linear-gradient(135deg,#E8631A,#C62828);
                          text-align:center;line-height:26px;font-size:11px;font-weight:700;color:#fff;">3</div>
            </td>
            <td style="padding-left:14px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#111;">Log in with ${userEmail}</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Open LIFECODE in Expo Go and enter your activation code</p>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="border-top:1px solid #f0f0f0;padding-top:28px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#ccc;line-height:2;">
          LIFECODE · Protocol Members Only<br/>
          <a href="mailto:hello@lifecode.app" style="color:#bbb;text-decoration:none;">hello@lifecode.app</a>
          &nbsp;·&nbsp;
          <a href="${siteUrl}" style="color:#bbb;text-decoration:none;">lifecode.app</a>
        </p>
      </td></tr>

    </table>
    </td></tr>
  </table>

</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, plan = 'protocol', name = '' } = await req.json() as { email: string; plan?: string; name?: string };

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
        user_metadata: { plan, full_name: name, display_name: name },
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
      options: { redirectTo: `${siteUrl}/` },
    });

    const magicLink = (linkData as any)?.properties?.action_link ?? `${siteUrl}/login`;

    // Generate and save activation code
    const activationCode = generateCode();
    await getAdminSupabase().from('activation_codes').insert({
      code: activationCode,
      user_id: userId,
      product_type: plan,
      used: false,
      created_at: new Date().toISOString(),
    });

    // Send email via Resend
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'LIFECODE <onboarding@resend.dev>';
    try {
      await getResend().emails.send({
        from: fromAddress,
        to: normalEmail,
        subject: 'Your LIFECODE Protocol is ready.',
        html: emailHtml(plan, magicLink, activationCode, normalEmail, name),
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

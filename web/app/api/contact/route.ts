import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { topic, name, email, message } = await req.json();
    if (!topic || !name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LIFECODE <onboarding@resend.dev>',
      to: 'hello@lifecodenutrition.com',
      replyTo: email,
      subject: `[${topic}] Message from ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
          <p style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#999;margin:0 0 24px;">LIFECODE · Contact</p>
          <h2 style="font-size:24px;font-weight:800;color:#0a0a0a;margin:0 0 8px;">${name}</h2>
          <p style="font-size:13px;color:#888;margin:0 0 24px;">${email} · ${topic}</p>
          <div style="background:#f9f9f9;border-radius:12px;padding:20px;font-size:15px;color:#333;line-height:1.7;">
            ${message.replace(/\n/g, '<br/>')}
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error.' }, { status: 500 });
  }
}

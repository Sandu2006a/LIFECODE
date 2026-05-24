export const metadata = {
  title: 'Terms of Use — LIFECODE',
  description: 'Terms and conditions for using the LIFECODE website.',
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px', fontFamily: 'inherit', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
        Terms of Use
      </h1>
      <p style={{ color: '#6b6b6b', fontSize: '14px', marginBottom: '48px' }}>Last updated: May 2026</p>

      <Section title="1. Acceptance">
        By accessing this website, you agree to these Terms of Use. If you do not agree, please do not use this site.
      </Section>
      <Section title="2. Informational purpose only">
        All content on this website is provided for informational purposes only. Nothing on this site constitutes
        medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before starting
        any supplement protocol.
      </Section>
      <Section title="3. Pre-launch — no financial obligation">
        Joining the LIFECODE founders waitlist does not constitute a purchase, pre-order commitment, or financial
        obligation of any kind. No payment information is collected during the pre-launch phase. Founder pricing,
        availability, and product specifications are subject to change without notice.
      </Section>
      <Section title="4. Accuracy of information">
        We make reasonable efforts to ensure the accuracy of information on this site, including ingredient claims
        and research citations. However, we do not warrant that all information is complete, current, or error-free.
        Performance claims are based on peer-reviewed research on individual ingredients and do not guarantee
        individual results.
      </Section>
      <Section title="5. Intellectual property">
        All content on this site — including text, images, logos, and design — is the property of LIFECODE Nutrition
        and may not be reproduced without written permission.
      </Section>
      <Section title="6. Limitation of liability">
        LIFECODE shall not be liable for any indirect, incidental, or consequential damages arising from the use
        of this website or reliance on any information provided herein.
      </Section>
      <Section title="7. Governing law">
        These Terms are governed by the laws of Romania and, where applicable, European Union regulations including
        GDPR. Any disputes shall be subject to the exclusive jurisdiction of Romanian courts.
      </Section>
      <Section title="8. Changes to these terms">
        We reserve the right to update these Terms at any time. Continued use of the site after changes constitutes
        acceptance of the revised Terms.
      </Section>
      <Section title="9. Contact">
        For any legal inquiries: <a href="mailto:lifecodenutrition@gmail.com">lifecodenutrition@gmail.com</a>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '36px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px', color: '#111' }}>{title}</h2>
      <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#3a3a3a', margin: 0 }}>{children}</p>
    </section>
  );
}

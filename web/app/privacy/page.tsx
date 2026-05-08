export const metadata = {
  title: 'Privacy Policy — LIFECODE',
  description: 'How LIFECODE collects and uses your data.',
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px', fontFamily: 'inherit', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.02em' }}>
        Privacy Policy
      </h1>
      <p style={{ color: '#6b6b6b', fontSize: '14px', marginBottom: '48px' }}>Last updated: May 2026</p>

      <Section title="1. Who we are">
        LIFECODE is a sports nutrition brand operated by Lifecode Nutrition SRL. For privacy inquiries, contact us at:{' '}
        <a href="mailto:privacy@lifecodenutrition.com">privacy@lifecodenutrition.com</a>
      </Section>
      <Section title="2. What data we collect">
        During the pre-launch phase, we collect only your email address and the timestamp of your signup.
        We do not collect payment information, physical addresses, or any other personal data at this stage.
      </Section>
      <Section title="3. How we use your data">
        Your email is used exclusively to notify you when LIFECODE products become available for purchase
        and to send you your founder discount code. We send a maximum of one launch notification email.
      </Section>
      <Section title="4. Legal basis (GDPR)">
        We process your data based on your explicit consent (GDPR Art. 6(1)(a)), provided when you submit
        your email address. You may withdraw consent at any time.
      </Section>
      <Section title="5. Data retention">
        We retain your email address until the product launch or for a maximum of 12 months from signup,
        whichever comes first. If you unsubscribe, your data is deleted within 30 days.
      </Section>
      <Section title="6. Your rights">
        Under GDPR, you have the right to: access your data, correct inaccurate data, request deletion
        (right to be forgotten), withdraw consent at any time, and lodge a complaint with your national
        data protection authority. To exercise any of these rights, email us at{' '}
        <a href="mailto:privacy@lifecodenutrition.com">privacy@lifecodenutrition.com</a>.
      </Section>
      <Section title="7. Cookies">
        We use essential cookies for site functionality. If you accept analytics cookies, we collect
        anonymised usage data to improve the site. You can decline analytics cookies using the banner
        on your first visit.
      </Section>
      <Section title="8. Third parties">
        We do not sell, rent, or share your email address with any third party. We use Resend to send
        emails, which processes data under a GDPR-compliant Data Processing Agreement.
      </Section>
      <Section title="9. International transfers">
        If you are located in the EU/EEA, your data is processed within the EU or under Standard
        Contractual Clauses where applicable.
      </Section>
      <Section title="10. Contact">
        LIFECODE Nutrition ·{' '}
        <a href="mailto:privacy@lifecodenutrition.com">privacy@lifecodenutrition.com</a>
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

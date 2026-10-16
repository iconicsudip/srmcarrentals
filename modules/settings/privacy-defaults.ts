import type { PrivacyPageContent } from "./site-content.schemas";

/** Starting privacy policy — shown until an admin saves their own version. */
export const DEFAULT_PRIVACY: PrivacyPageContent = {
  hero: {
    badge: "YOUR PRIVACY MATTERS",
    title: "PRIVACY POLICY",
    subtitle: "How SRM Car Rentals collects, uses and protects your personal information.",
  },
  lastUpdated: "",
  intro:
    "<p>SRM Car Rentals (\"we\", \"us\", \"our\") respects your privacy. This policy explains what information we collect when you browse our website or book a car, taxi or tour with us, how we use it, and the choices you have.</p><p>By using our website or services you agree to the practices described below.</p>",
  sections: [
    {
      id: "information-we-collect",
      title: "Information We Collect",
      body: "<p>We collect only what we need to serve you:</p><ul><li><strong>Identity &amp; contact details</strong> — name, phone number, email address and address.</li><li><strong>Verification documents</strong> — driving licence and ID proof (Aadhaar, Passport or Voter ID) required before a self-drive handover.</li><li><strong>Booking details</strong> — pickup and drop locations, travel dates, vehicle chosen and special requests.</li><li><strong>Payment details</strong> — payment status and transaction references. Card, UPI and net-banking details are handled by our payment partner and are never stored on our servers.</li><li><strong>Technical data</strong> — device, browser, IP address and pages visited, collected through cookies and analytics tools.</li></ul>",
    },
    {
      id: "how-we-use-information",
      title: "How We Use Your Information",
      body: "<ul><li>To confirm, manage and support your bookings.</li><li>To verify your eligibility to drive and prevent fraud or misuse of vehicles.</li><li>To process payments, refunds and security deposits.</li><li>To send booking confirmations, reminders and service updates by SMS, email or WhatsApp.</li><li>To improve our website, fleet and customer service.</li><li>To send offers and promotions — only where you have agreed, and you can opt out at any time.</li></ul>",
    },
    {
      id: "sharing-of-information",
      title: "Sharing of Information",
      body: "<p>We do not sell your personal information. We share it only with:</p><ul><li>Payment gateways and banks to complete your transactions.</li><li>Service providers who help us run the business (SMS, email, WhatsApp, analytics and hosting), under confidentiality obligations.</li><li>Chauffeurs and delivery staff, limited to what is needed to complete your trip.</li><li>Authorities, where required by law, court order or to protect rights, safety and property.</li></ul>",
    },
    {
      id: "cookies",
      title: "Cookies & Tracking",
      body: "<p>We use cookies to keep your cart and preferences, understand how the site is used and improve it. You can disable cookies in your browser settings, though some parts of the site may not work as expected.</p>",
    },
    {
      id: "data-security",
      title: "Data Security",
      body: "<p>We use reasonable technical and organisational safeguards — encrypted connections, restricted access and secure storage — to protect your data. No method of transmission over the internet is completely secure, so we cannot guarantee absolute security.</p>",
    },
    {
      id: "data-retention",
      title: "Data Retention",
      body: "<p>We keep your information only as long as needed for the purposes above, to meet legal, tax and accounting requirements, and to resolve disputes. Verification documents are retained for the period required for rental and safety records.</p>",
    },
    {
      id: "your-rights",
      title: "Your Rights & Choices",
      body: "<ul><li>Ask to access, correct or update the personal information we hold about you.</li><li>Ask us to delete your information, subject to legal and record-keeping obligations.</li><li>Withdraw consent to marketing messages at any time.</li></ul><p>To exercise these rights, contact us using the details below.</p>",
    },
    {
      id: "childrens-privacy",
      title: "Children's Privacy",
      body: "<p>Our services are intended for adults. Renters must be at least 21 years old, and we do not knowingly collect personal information from children.</p>",
    },
    {
      id: "policy-changes",
      title: "Changes to This Policy",
      body: "<p>We may update this policy from time to time. The latest version is always available on this page, with the date it was last updated.</p>",
    },
  ],
  contact: {
    show: true,
    title: "Questions about your privacy?",
    text: "Write to us and we will respond as soon as we can.",
    buttonLabel: "Contact Us",
    buttonHref: "/contact-us",
  },
};

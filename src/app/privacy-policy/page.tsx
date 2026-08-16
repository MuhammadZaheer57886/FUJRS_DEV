const sections = [
  {
    title: "Information We Collect",
    body: "We collect information you provide directly (name, email, shipping address, and payment details) as well as browsing behavior on our site to improve your shopping experience.",
  },
  {
    title: "How We Use Your Information",
    body: "Your information is used to process orders, provide customer support, personalize product recommendations, and send updates you've opted into (like our newsletter).",
  },
  {
    title: "Payment Security",
    body: "Payment details are processed through secure, PCI-compliant payment providers. FUJRS does not store your full card details on our servers.",
  },
  {
    title: "Cookies",
    body: "We use cookies to keep items in your bag and wishlist between visits, and to understand how the site is used so we can improve it.",
  },
  {
    title: "Your Rights",
    body: "You can request a copy of the data we hold about you, ask us to correct it, or request deletion at any time by contacting us.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="container-luxe py-16">
      <p className="label-caps text-gold">Legal</p>
      <h1 className="mt-2 font-display text-headline-md">Privacy Policy</h1>
      <p className="mt-3 text-label-sm text-text-muted">Last updated: July 2026</p>

      <div className="mt-10 max-w-2xl space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="font-display text-headline-sm">{section.title}</h2>
            <p className="mt-3 text-body-md text-text-muted">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

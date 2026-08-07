// EmailJS credentials for the contact form.
// Fill these in from your EmailJS dashboard (https://dashboard.emailjs.com):
//   publicKey  — Account → General → Public Key
//   serviceId  — Email Services → your Gmail service
//   templateId — Email Templates → your template
// These are public by design (EmailJS keys are browser-side). Restrict abuse in the
// EmailJS dashboard: Account → Security → allowlist lakefronttechps.com, and keep
// the default rate limits on.
window.LAKEFRONT_EMAIL_CONFIG = {
  publicKey: 'YOUR_PUBLIC_KEY',
  serviceId: 'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID'
};

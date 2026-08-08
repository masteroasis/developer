/* ===========================================================================
   SITE CONFIG — developer settings. Paste URLs here to switch features on.

   Everything is off until you fill it in, and every section says so on the
   page rather than pretending to work. Nothing here is a secret: this file
   ships to the browser, so only ever put PUBLIC links in it. No API keys,
   no Stripe secret key (the "sk_" one) — publishable links only.
   =========================================================================== */

window.SITE_CONFIG = {

  /* --- Where the bulletin gets its events -------------------------------
     'local'  → read from events.js (a developer edits and pushes)
     a URL    → read from a published Google Sheet (CSV) or a JSON file

     To let a group leader manage events from a Google Sheet:
       1. Make a sheet whose first row is exactly:
          title | date | time | place | tag | description | link | rsvp
       2. File → Share → Publish to web → choose the sheet → CSV → Publish
       3. Paste the generated URL below, replacing 'local'

     Dates in the sheet must be plain text in YYYY-MM-DD form. Format the
     date column as "Plain text" first, or Sheets will helpfully mangle it.

     If the sheet is ever unreachable, the site quietly falls back to
     events.js so the bulletin is never empty. */
  eventsSource: 'local',

  /* --- Contact form -----------------------------------------------------
     A Formspree or Basin endpoint, e.g. 'https://formspree.io/f/xxxxxxx'.
     Leave empty and the form validates but refuses to send, telling the
     visitor to email instead. */
  contactEndpoint: '',

  /* --- Gather -----------------------------------------------------------
     volunteerUrl — a SignUpGenius / Planning Center / Google Form link for
                    meal and serving slots.
     bookingUrl   — a Calendly or Cal.com link for time with a leader.
     Per-event RSVP links live on the event itself, not here. */
  volunteerUrl: '',
  bookingUrl: '',

  /* --- Support ----------------------------------------------------------
     Each item becomes a card. `url` is a Stripe Payment Link, a church
     giving page, or any checkout URL. Items without a url render as
     "coming soon" rather than a dead button.

     price is free text — '$45', 'Free', 'Pay what you can' all work. */
  support: {
    items: [
      {
        name: 'Retreat registration',
        price: '$45',
        description: 'Covers lodging and meals for the weekend. Scholarships are available — just ask, and no one is turned away.',
        cta: 'Register',
        url: ''
      },
      {
        name: 'Study guide',
        price: '$12',
        description: 'The book we are working through together. Pick yours up at the next gathering or have it shipped.',
        cta: 'Buy a copy',
        url: ''
      },
      {
        name: 'Give',
        price: 'Any amount',
        description: 'Support the scholarship fund so cost is never the reason someone stays home.',
        cta: 'Give',
        url: ''
      }
    ]
  }
};

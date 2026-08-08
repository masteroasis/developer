# The Waters — thewaters.life

A gathering-place site for a church women's group. Plain HTML, CSS, and vanilla
JS — no build step, no dependencies, no framework. Deploys to Cloudflare Pages
from GitHub Actions.

It lives in a subdirectory of this repo for now and is designed to be lifted
into its own repository. See [Exporting to its own repo](#exporting-to-its-own-repo).

```
thewaters/
├── .github/workflows/deploy.yml   # Cloudflare Pages deploy (inactive until exported)
├── public/                        # everything in here is what gets published
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── config.js                  # developer settings — paste URLs here
│   ├── events.js                  # the bulletin content
│   ├── 404.html
│   └── robots.txt
└── README.md
```

## Previewing locally

```sh
cd thewaters/public
python3 -m http.server
```

Open <http://localhost:8000>. Reload to see changes; there is nothing to compile.

## The design

Warm, sunlit, buoyant — the brief was "floating in water, bubbles rising as you
scroll."

- The page sits on a **fixed warm gradient that deepens toward the bottom**, so
  scrolling down reads as sinking.
- A **canvas bubble field** floats behind everything. Bubbles rise on their own
  and take a shove from the scroll wheel — scrolling down drives them up faster,
  scrolling up slows them. Bubble count scales with viewport size and caps at 70.
- Sections are **translucent on purpose** so the bubbles show through. Cards are
  frosted glass so text stays readable over the motion. If you give a full-width
  block an opaque background, the bubbles vanish behind it.
- Everything animated sits behind a `prefers-reduced-motion` check. When motion
  is reduced, JS never starts the canvas at all and CSS hides it as a fallback.

Re-theme from the variables at the top of `styles.css`.

## Updating the bulletin

Two options, depending on who is doing it.

### A developer, editing a file

Open `public/events.js` and copy one block. Events sort themselves by date and
drop off the site the day after they happen. Dates are `YYYY-MM-DD` with leading
zeros — anything else is treated as a typo and shown rather than silently hidden,
so the mistake is visible.

### A group leader, using a Google Sheet — recommended here

Since a non-technical leader is maintaining this, hand-editing a `.js` file will
not hold up. Point the site at a spreadsheet instead:

1. Make a sheet whose first row is exactly:
   `title | date | time | place | tag | description | link | rsvp`
2. Format the **date column as plain text** first, then enter dates as
   `2026-09-01`. Otherwise Sheets reformats them and the site can't read them.
3. **File → Share → Publish to web →** pick the sheet, choose **CSV**, publish.
4. Paste that URL into `eventsSource` in `public/config.js`, replacing `'local'`.

The leader then edits a spreadsheet and the site follows, with no logins, no CMS,
and nothing to deploy. If the sheet is ever unreachable the site quietly falls
back to `events.js`, so the bulletin is never empty.

A Git-backed CMS (Decap, Sveltia, Pages CMS) is the other route. It gives a nicer
admin UI but needs a GitHub OAuth proxy running as a Cloudflare Worker — more
moving parts to hand over. Worth revisiting if the sheet starts to chafe.

## Turning features on

Everything is off until a URL is pasted into `public/config.js`, and every
section says so on the page rather than pretending to work.

| Setting | Turns on |
| --- | --- |
| `eventsSource` | Bulletin reads from a Google Sheet or JSON feed instead of `events.js` |
| `contactEndpoint` | The contact form actually sends |
| `volunteerUrl` | "Sign up to bring or serve" button in Gather |
| `bookingUrl` | "Book time with a leader" button in Gather |
| `support.items[].url` | Turns that card's button into a live checkout link |
| `rsvp` on an event | "Save my spot" button on that event in the bulletin |

`config.js` ships to the browser, so **only public links belong in it** — never a
Stripe secret key (`sk_...`) or any API credential.

## Contact form

Collects **name, email, and phone** (all required) plus an optional note.
Validates inline, focuses the first bad field, and carries a honeypot for bots.
Phone validation is deliberately loose — 7+ digits — because `(555) 555-0100`,
`+1 555 555 0100`, and `555.555.0100` are all things real people type.

It does not send anything yet. Set `contactEndpoint` to a Formspree or Basin URL
and it starts posting; until then it tells the visitor to email instead. Test a
real submission before launch and confirm where the mail lands.

## Decisions still open

Answered so far: they want event/retreat fees, merchandise, and donations; they
want a calendar plus RSVP-with-headcount and volunteer/meal slots; a
non-technical leader maintains it.

**The open question is whether the church already uses Planning Center, Breeze,
or Tithe.ly.** It's worth chasing before building anything else, because it
collapses most of the remaining work:

- **If they use Planning Center** — it already does registrations with payment,
  headcounts, and giving. Point `rsvp` and the support links at PC and skip
  Stripe entirely. Cheaper, and it keeps giving records where the church's
  bookkeeper expects them.
- **If they use nothing** — Stripe Payment Links cover all three sales cases with
  no backend: a fixed-price link per retreat, one per merch item, and an
  open-amount link for giving. Paste each into `config.js`.

Two things to flag with them regardless:

- **Donations are not just a payment.** If the church is a 501(c)(3), giving
  should run through whatever already issues contribution statements at year end.
  Taking donations through a separate Stripe account creates a bookkeeping mess
  in January. Ask before wiring the Give card.
- **Volunteer slots want a real tool.** "One slot, claimed once" needs server-side
  state that a static site can't provide. SignUpGenius is free and is what most
  church groups already use; Planning Center does it too. I'd link out rather
  than build it.

## Deploying

The workflow uses `cloudflare/wrangler-action` (`cloudflare/pages-action` is
deprecated). Once the project is in its own repo:

1. **Create the Pages project.** Cloudflare dashboard → Workers & Pages → Create
   → Pages → Direct Upload. Name it `thewaters` to match `deploy.yml`.
2. **Create an API token.** My Profile → API Tokens → Create Token, using the
   *Edit Cloudflare Workers* template, or a custom token with
   `Account → Cloudflare Pages → Edit`.
3. **Add two repo secrets** under Settings → Secrets and variables → Actions:
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Pushes to `main` publish to production; pull requests get their own preview URL,
which is a good way to show the group a change before it goes live.

## Pointing thewaters.life (registrar: GoDaddy)

The registrar and the host are separate. The domain stays registered at GoDaddy
either way; only its DNS records change.

**`www` only — DNS stays at GoDaddy.** In GoDaddy: My Products → Domains → DNS →
Manage Zones.

```
Type    Name    Value
CNAME   www     thewaters.pages.dev
```

Then add `www.thewaters.life` as a custom domain in the Pages project so
Cloudflare issues the certificate. The bare domain will not work this way — you
can't CNAME an apex, and GoDaddy has no ALIAS/ANAME record type.

**Bare `thewaters.life` — nameservers move to Cloudflare.** Add the domain as a
site in Cloudflare, then in GoDaddy go to Nameservers → Change → I'll use my own
and enter the two Cloudflare provides. This is a nameserver change, *not* a
domain transfer — ownership and renewal stay at GoDaddy. Cloudflare's CNAME
flattening then handles the apex.

> **Check email records before moving nameservers.** If `thewaters.life` sends or
> receives mail, the MX, SPF, DKIM, and DMARC records must be recreated in the
> Cloudflare zone. Cloudflare's scan usually catches them, but verify each against
> the old GoDaddy zone before flipping. A missed record breaks mail silently, and
> that is a worse outage than any website problem.

Before launch, in the GoDaddy zone: delete the parked-page records that ship with
a new domain, turn off Domain Forwarding if it's on, and drop TTL to 600s a day
beforehand so mistakes are cheap to undo. Propagation is usually minutes; allow
up to 48 hours before worrying.

If you'd rather not move nameservers at all, Netlify and Vercel publish apex A
records, so the bare domain works with DNS untouched at GoDaddy. Get current
values from their docs at the time you set it up — those addresses do change.

## Before launch

- [ ] Replace the About copy, meeting day/time, and address
- [ ] Replace `hello@thewaters.life` and the placeholder phone number
- [ ] Replace the four sample events, or point `eventsSource` at the sheet
- [ ] Add a real `og-image.png` at 1200×630 in `public/`
- [ ] Wire the contact form and send a live test
- [ ] Confirm the group is happy being listed with a public phone number

## Exporting to its own repo

```sh
# from the parent directory of this repo
mkdir thewaters-site && cd thewaters-site
git init -b main
cp -R ../developer/thewaters/. .
git add -A
git commit -m "Initial site"
git remote add origin git@github.com:<owner>/thewaters.git
git push -u origin main
```

`.github/workflows/deploy.yml` only runs from a repository root, so this is the
point at which deploys start working.

To hand the repo to the group later, use GitHub's Settings → General → Transfer
ownership rather than recreating it — history, issues, and PRs come along. Note
that Actions secrets do **not** transfer; re-add them, ideally with a token from
the group's own Cloudflare account.

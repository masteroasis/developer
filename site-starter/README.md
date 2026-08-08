# Static site starter

A dependency-free static site scaffold — plain HTML, CSS, and vanilla JS, no build
step — set up to deploy to Cloudflare Pages from GitHub Actions.

It lives in this repo for now so the structure can be built up before the client
has any accounts. It is designed to be lifted out into its own repository later;
see [Exporting to its own repo](#exporting-to-its-own-repo).

```
site-starter/
├── .github/workflows/deploy.yml   # Cloudflare Pages deploy (inactive until exported — see below)
├── public/                        # everything in here is what gets published
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── 404.html
│   └── robots.txt
└── README.md
```

Only `public/` is uploaded to the CDN, so the README and workflow never ship to
visitors.

## Previewing locally

No build step and no dependencies:

```sh
cd site-starter/public
python3 -m http.server
```

Then open <http://localhost:8000>. Reload to see changes; there's nothing to compile.

## Placeholders to replace

Every placeholder is a literal string you can grep for:

```sh
grep -rn "Client Name\|clientdomain.com\|CHANGE-ME\|20XX\|555-0100\|City, State" site-starter/
```

| Placeholder | Where | What it becomes |
| --- | --- | --- |
| `Client Name` | all HTML | The business name |
| `clientdomain.com` | HTML meta tags, `robots.txt` | The real domain |
| `CHANGE-ME` | `deploy.yml` | The Cloudflare Pages project name |
| `20XX`, `(555) 555-0100`, `City, State` | `index.html` | Real business details |

Re-theming is done through the CSS variables at the top of `public/styles.css` —
four brand colors and a neutral ramp. Change those rather than hunting through
the file for hex codes.

## Deploying

The workflow uses `cloudflare/wrangler-action` (the older `cloudflare/pages-action`
is deprecated). Once the project is in its own repo:

1. **Create the Cloudflare Pages project.** In the Cloudflare dashboard:
   Workers & Pages → Create → Pages → Direct Upload. Name it, then put that name
   in `deploy.yml` in place of `CHANGE-ME`.
2. **Create an API token.** My Profile → API Tokens → Create Token, using the
   *Edit Cloudflare Workers* template, or a custom token with
   `Account → Cloudflare Pages → Edit`.
3. **Add two repo secrets** under Settings → Secrets and variables → Actions:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID` (shown in the URL of the Cloudflare dashboard, and
     on the account's overview page)

Pushes to `main` publish to production. Pull requests get their own preview URL,
which is a good way to show the client a change before it goes live.

Deploying by API token rather than Cloudflare's built-in Git integration keeps
the two accounts decoupled — the repo doesn't need Cloudflare's GitHub App
installed, so whose Cloudflare account holds the project stays an implementation
detail you can change later without touching the repo.

## Pointing the domain (registrar: GoDaddy)

The registrar and the host are separate. The domain stays registered at GoDaddy
either way; only its DNS records change.

**Cloudflare Pages, `www` only — DNS stays at GoDaddy.**
In GoDaddy: My Products → Domains → DNS → Manage Zones.

```
Type    Name    Value
CNAME   www     <project>.pages.dev
```

Then add `www.clientdomain.com` as a custom domain in the Pages project so
Cloudflare issues the certificate. The bare domain will not work this way — you
can't CNAME an apex, and GoDaddy has no ALIAS/ANAME record type.

**Cloudflare Pages with the bare domain — nameservers move to Cloudflare.**
Add the domain as a site in Cloudflare, then in GoDaddy go to Nameservers →
Change → I'll use my own and enter the two Cloudflare gives you. This is a
nameserver change, *not* a domain transfer — the client keeps ownership and
renewal at GoDaddy. Cloudflare's CNAME flattening then handles the apex.

> **Check email records before moving nameservers.** If the domain sends or
> receives mail (Google Workspace, Microsoft 365, anything else), the MX, SPF,
> DKIM, and DMARC records must be recreated in the Cloudflare zone. Cloudflare's
> scan usually catches them, but verify each one against the old GoDaddy zone
> before flipping the nameservers. A missed record breaks mail silently.

**If you'd rather not move nameservers at all**, Netlify and Vercel both publish
apex A records, so the bare domain works with DNS untouched at GoDaddy. Get the
current values from their docs at the time you set it up rather than copying
numbers from anywhere — they do change.

Before launch, in the GoDaddy zone:

- Delete the parked-page A/CNAME records that ship with a new domain.
- Turn off Domain Forwarding if it's on — it silently overrides your records.
- Drop TTL to 600s a day before cutover so mistakes are cheap to undo.

Propagation is usually minutes; allow up to 48 hours before worrying.

## Making the contact form work

The form in `index.html` has **no backend**. `script.js` currently intercepts the
submit and shows a "not connected yet" message, so it can't look like it's
sending mail when it isn't.

To wire it up, pick one and then remove the `data-form-unwired` attribute from
the `<form>` tag:

- **Formspree / Basin** — change the form's `action` to the endpoint they give
  you. Works on any host, no server code.
- **Cloudflare Worker or Pages Function** — a `functions/api/contact.js` that
  forwards to an email API. Stays entirely within Cloudflare.
- **Netlify Forms** — add `netlify` to the form tag. Zero config, but only if
  the site is hosted on Netlify.

Whichever you choose, test a real submission before launch and confirm where the
mail lands.

## Exporting to its own repo

The scaffold is self-contained, so exporting is a copy:

```sh
# from the parent directory of this repo
mkdir client-site && cd client-site
git init -b main
cp -R ../developer/site-starter/. .
git add -A
git commit -m "Initial site scaffold"
git remote add origin git@github.com:<owner>/client-site.git
git push -u origin main
```

Then, in the new repo: add the two Cloudflare secrets, replace `CHANGE-ME` in
`deploy.yml`, and push. `.github/workflows/deploy.yml` only runs from a
repository root, so this is the point at which deploys start working.

To hand the repo to the client later, use GitHub's Settings → General → Transfer
ownership rather than recreating it — issues, history, and PRs come along. Note
that the Actions secrets do **not** transfer; re-add them, ideally with a token
from the client's own Cloudflare account.

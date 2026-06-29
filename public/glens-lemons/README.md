# Glen's Lemons 🍋

A simple, mobile-friendly website for **Glen's Lemons** — fresh squeezed lemonade
in **Sioux Falls, South Dakota**.

> Fresh Squeezed Lemonade. Simple Ingredients: Water, Sugar, and Lemons.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | The full single-page site (hero, about, menu, find us, footer) |
| `styles.css` | All styling — lemonade-yellow theme, responsive layout |
| `script.js` | Mobile nav toggle + footer year |

It's a plain static site — no build step, no dependencies.

## Live link

The site lives in this Next.js app's `public/glens-lemons/` folder, so the Vercel
deployment serves it directly. A rewrite in `next.config.js` maps the clean path:

- **`/glens-lemons`** → `public/glens-lemons/index.html`

So on any deployment (preview or production) the live URL is
`https://<deployment-domain>/glens-lemons`.

## View it locally

Just open `index.html` in any browser:

```bash
xdg-open public/glens-lemons/index.html  # Linux
open public/glens-lemons/index.html      # macOS
```

Or serve the folder (so anchor links and assets behave like production):

```bash
cd public/glens-lemons
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

Because it's static, you can also host this folder on any static host —
GitHub Pages, Netlify, Cloudflare Pages, or an S3 bucket. No server needed.

## Customizing

- **Contact email** — set in `index.html` (mailto links) and as `EMAIL` in `catering-form.js`.
- **Catering inquiry form** — questions live in the `QUESTIONS` array in `catering-form.js`. To collect inquiries without the visitor's email app, set `FORMSPREE_ENDPOINT` to a Formspree URL.
- **Location** — edit the "Find Us" section in `index.html`.
- **Prices / sizes** — edit the menu cards in `index.html`.
- **Colors** — tweak the CSS variables at the top of `styles.css`.

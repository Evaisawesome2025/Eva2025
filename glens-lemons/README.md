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

## View it locally

Just open `index.html` in any browser:

```bash
open glens-lemons/index.html      # macOS
xdg-open glens-lemons/index.html  # Linux
```

Or serve the folder (so anchor links and assets behave like production):

```bash
cd glens-lemons
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

Because it's static, you can host the `glens-lemons/` folder on any static host —
GitHub Pages, Netlify, Vercel, Cloudflare Pages, or an S3 bucket. No server needed.

## Customizing

- **Contact email** — replace `hello@glenslemons.com` in `index.html`.
- **Hours / location** — edit the "Find Us" section in `index.html`.
- **Prices / sizes** — edit the menu cards in `index.html`.
- **Colors** — tweak the CSS variables at the top of `styles.css`.

# PROJECT_CONTEXT.md — Full Context for AI Assistants

Read this together with **AGENTS.md**. AGENTS.md covers the original static migration
(runtime, publishing gotchas, header/footer quirks). This file covers the **dynamic,
structured-content work** built on top of it (data sheet + filter + sort + compare).

## The two credit-card pages

There are **two** versions of the RBC "All Credit Cards" listing, intentionally kept side by side:

| Page | Path | How cards are built | Interactive features |
|------|------|---------------------|----------------------|
| **Static** | `/credit-cards/all-credit-cards-p` | Each card authored by hand in the page | None (faithful migration of the RBC source) |
| **Dynamic** | `/credit-cards/all-credit-cards-dynamic` | Rendered at runtime from a shared data sheet | Filter, Sort, Compare |

The static page is the original migration. The dynamic page is the "smart" version: one
structured data source drives a listing that filters, sorts, and compares itself. Editing a
card = editing one row in the sheet (no page editing).

## The data sheet — `cards-data.json`

- **Source (DA):** `/credit-cards/cards-data` (a da.live sheet), published to
  `https://main--rbc-eds-demo--mujtsa.aem.live/credit-cards/cards-data.json`.
- **Shape:** EDS sheet JSON — `{ total, limit, offset, data: [...], ":type": "sheet" }`.
  Blocks read `Array.isArray(json) ? json : (json.data || [])`.
- **16 cards.** Columns:
  `id, title, category, fee, image, applyUrl, viewUrl, badge`.
- **`id`** is a slug of the title (e.g. `rbc-avion-visa-infinite`). It is the join key used by
  the compare feature to resolve `?cards=` URL params back to card records. Every card MUST have
  a unique `id` or it can't be compared.
- **`image`** values are absolute `…aem.live/credit-cards/media_<hash>.webp` URLs (already ingested
  into the DA media pipeline). See AGENTS.md for why external/absolute-non-media URLs render as
  `about:error`.

> This sheet holds **public marketing data only** (names, fees, categories, apply links) — the same
> info already shown on the public page. Do NOT put anything sensitive in it: the page fetches it
> client-side, so whatever the page can read, any visitor can read. To protect non-public data you'd
> need EDS authentication (gates the whole site) or a separate authenticated API — not a public sheet.

## Blocks involved in the dynamic page

| Block | File(s) | Role |
|-------|---------|------|
| `cards-product` | `cards-product.js` / `.css` | Renders card tiles. **Dual mode:** if the block contains a link to a `.json` sheet it fetches + renders from data (`renderCardFromData`); otherwise it decorates authored rows (`decorateAuthoredRows`). Adds the Compare checkbox per card. |
| `cards-compare` | `cards-compare.js` / `.css` | The comparison page block. Reads `?cards=id1,id2,id3` from the URL, fetches the sheet, builds a side-by-side `<table>` (rows: image, title, fee, category, Apply). Handles empty state. |
| `columns-filter` | `columns-filter.js` | "Filter by Category" pill row. Clicking a pill calls `setCategory()`. |
| `columns-toolbar` | `columns-toolbar.js` | "Showing N cards" + real `<select>` Sort-by dropdown. `change` calls `setSort()`. |

### Shared controllers (imported by multiple blocks)

- **`blocks/cards-product/compare.js`** — the compare controller + bottom tray.
  - State: `selected` Map (max 3) + `registry` Map (id → checkbox).
  - Exports `register(card, input)` and `toggle(card, on)`.
  - Renders a fixed bottom `.compare-tray` with up to 3 slots + a Compare button.
  - Persists selection to `sessionStorage` (`STORAGE_KEY = 'rbc-compare'`).
  - Builds the shareable URL: `COMPARE_PATH = '/credit-cards/compare'` →
    `/credit-cards/compare?cards=id1,id2`.
  - The Compare button is an `<a>`, so it uses a `.is-disabled` **class** (anchors can't use the
    `disabled` attribute); it only gets an `href` once ≥ 2 cards are selected.
- **`blocks/cards-product/cards-filter-sort.js`** — the shared filter + sort controller.
  - State `{ category, sort }`. Exports `render()`, `setCategory()`, `setSort()`, `norm()`.
  - `render()` filters by category, then sorts, then updates the toolbar count. Filter and sort
    **compose** — both read the same state and re-run `render()`.
  - "No Annual Fee" filter reads the `.cards-product-annual-fee` paragraph and matches `/^\$0(\.0+)?$/`
    on the fee value (NOT the whole card text — the naive regex matched concatenated "$0Apply Now").

## The compare feature — end-to-end flow

1. Each card on the dynamic page has a **Compare checkbox** (rendered *above* the blue Apply Now bar,
   at the bottom of the card body).
2. Checking a box registers the card with `compare.js`, which slides up the **bottom tray** (max 3
   cards; further checkboxes disable at the max).
3. The tray's **Compare button** activates at ≥ 2 selections and links to
   `/credit-cards/compare?cards=<ids>`.
4. The **`/credit-cards/compare`** page (`cards-compare` block, authored with a link to
   `cards-data.json`) reads the ids, looks them up in the sheet, and renders the side-by-side table.
5. Selection survives navigation via `sessionStorage`; the URL makes a comparison shareable.

## Card body render order (cards-product)

`badge → h3 (title) → annual fee → Compare checkbox → Apply Now bar`.
The Compare checkbox was intentionally moved to sit **above** the Apply Now bar. In the CSS,
`.cards-product-compare` carries `margin-top: auto` (pushes the compare+apply pair to the card
bottom) and `.cards-product-apply` uses `margin: 0 -20px -24px` to bleed to the card edges directly
below it.

## Verifying changes (important)

- Block JS/CSS is served from the CDN and imported by the page **without a cache-buster**, so a
  long-lived browser session can keep serving a **stale module** after a deploy. To confirm a deploy
  landed, either `curl --compressed <blocks/.../file.js>` and grep for the change, or **close and
  reopen** the browser tab. A `?query=param` on the page URL does NOT bust the block module cache.
- Always verify on the **published `aem.live` / `aem.page`** URL, not just localhost — see AGENTS.md
  for why local preview masks class-stripping and image-path issues.

## Deploy loop

1. Edit block `.js` / `.css` under `blocks/…`.
2. `git commit` + `git push origin main` (identity: `smujtaba677` /
   `smujtaba677@users.noreply.github.com`; credentials injected via Settings opt-in — never paste
   tokens). AEM Code Sync auto-deploys.
3. Content (pages, the sheet) lives in **DA**, not the repo — publish via
   `POST admin.da.live/source/...` then `POST admin.hlx.page/preview|live/...` (see AGENTS.md).

# AGENTS.md — Project Context for AI Tools

Context for AI assistants working on this repository. Read this first.

## What this project is

An **AEM Edge Delivery Services (EDS)** site that hosts a migration of the RBC Royal Bank
**"All Credit Cards"** listing page. The original source page is
`https://www.rbcroyalbank.com/credit-cards/all-credit-cards-p.html`.

- **Project type:** `da` (Document Authoring / da.live) — see `.migration/project.json`.
- **Not** a `doc` (SharePoint/GDrive) or `xwalk` (Universal Editor) project.

## Where things live (org / repo / URLs)

| Thing | Value |
|-------|-------|
| GitHub repo | `github.com/mujtsa/rbc-eds-demo` |
| DA org / repo | `mujtsa` / `rbc-eds-demo` |
| Content source | `https://content.da.live/mujtsa/rbc-eds-demo/` (see `fstab.yaml`) |
| Preview host | `https://main--rbc-eds-demo--mujtsa.aem.page/{path}` |
| Live host | `https://main--rbc-eds-demo--mujtsa.aem.live/{path}` |
| Edit in DA | `https://da.live/edit#/mujtsa/rbc-eds-demo/{path}` |
| Migrated page | `/credit-cards/all-credit-cards-p` |

> **Note:** an earlier `smujtaba677` org was abandoned — the Adobe/GitHub account has access to
> **`mujtsa`**, not `smujtaba677`. Always use `mujtsa`.

## Runtime — this is AuthorKit, NOT vanilla EDS

This scaffold uses the **AuthorKit runtime** (`scripts/ak.js`), **not** the standard
`aem.js` boilerplate. Consequences for block code:

- There is **no `scripts/aem.js`**. Do NOT `import { createOptimizedPicture } from '../../scripts/aem.js'`
  or `moveInstrumentation` — those modules 404 and the block silently fails to decorate.
- Write blocks as an import-free `export default function decorate(block) { ... }` (or `init(el)` for
  header/footer) that manipulate the DOM directly. See the existing blocks for the pattern.
- `buildAutoBlocks` / picture decoration lives in `scripts/ak.js` (`decoratePictures`). A defensive
  guard was added there for `<picture>` without `<source>`.

## Blocks (new variants created for this migration)

All derived from the standard `cards` / `columns` blocks:

| Block | Base | Renders |
|-------|------|---------|
| `blocks/cards-product/` | cards | Grid of 16 credit-card tiles (image, badge, title, annual fee, yellow offer box, feature/rate lists, blue "Apply Now" bar) |
| `blocks/cards-callout/` | cards | 3-up "How to Apply" callouts (icon + heading + text + CTA, colored backgrounds) |
| `blocks/columns-filter/` | columns | "Filter by Category" pill row |
| `blocks/columns-toolbar/` | columns | Results toolbar ("Showing N cards" + Sort-by dropdown) |

`blocks/header/` and `blocks/footer/` were rewritten (not new) for the RBC 3-row header and
multi-column footer — see "Header/footer" below.

## Design system

- `styles/brand.css` — RBC brand tokens: body font **Roboto** (Google Fonts, loaded via `head.html`),
  heading font **RBCDisplay** (proprietary → sans-serif fallback), link blue `rgb(0 106 195)`,
  text `rgb(37 37 37)`, light section band `rgb(237 247 252)`.
- `styles/styles.css` — imports `brand.css` (first line), wires brand tokens into the base variables,
  EDS button reset, section variants, and the brand-blue H1 treatment.

## Import infrastructure (for re-importing / similar pages)

Under `tools/importer/`:
- `page-templates.json` — the `all-credit-cards` template + block mappings + section definitions.
- `parsers/*.js` — one per block variant (cards-product, cards-callout, columns-filter, columns-toolbar).
- `transformers/rbcroyalbank-cleanup.js` — strips non-authorable chrome (header/footer/nav, cookie
  consent, mobile side-menu `#side-menu-id`, compare tray, `#no-cards-found` empty state, stray
  `ui-checkmark-blue` image). `rbcroyalbank-sections.js` — inserts `<hr>` section breaks.
- `import-all-credit-cards.js` — orchestration script (bundle with `aem-import-bundle.sh`, run with
  `run-bulk-import.js`). Also strips the runtime-injected checkmark after WebImporter rules run.

## Publishing to Document Authoring — CRITICAL gotchas

Content under `content/` is **git-ignored** — it lives in DA, not the repo. To publish:

1. **Upload a FULL html document** to DA (not a bare `.plain.html` fragment):
   `POST https://admin.da.live/source/mujtsa/rbc-eds-demo/{path}.html`
   Body must be `<body><header></header><main>…content…</main><footer></footer></body>`.
   Uploading a headless fragment renders an **empty** page.
2. **Preview then publish:**
   `POST https://admin.hlx.page/preview/mujtsa/rbc-eds-demo/main/{path}` then `.../live/...`.
3. **Images MUST use relative `./images/…` paths** in the DA document, co-located under the page's
   folder (e.g. `/credit-cards/images/`). DA then ingests them into its media pipeline and rewrites to
   `./media_<hash>.webp?width=…&format=…&optimize=medium`. **Absolute paths or external URLs render as
   `about:error`** — EDS only serves images from its own media store. (This is why the 16 external RBC
   card `.webp` URLs had to be downloaded, uploaded to DA, and rewritten to `./images/`.)
4. Credentials for `admin.da.live` / `admin.hlx.page` / `git push` are **injected automatically** when
   the matching opt-in is enabled in Settings → LLM Permissions. Never paste tokens into chat.

## Header/footer — plain.html quirks (why local ≠ published)

Fragments live at `content/fragments/nav/header.plain.html` and `.../footer.plain.html`, fetched by
`blocks/header/header.js` and `blocks/footer/footer.js` (dual-fetch: `/content{path}.plain.html` then
`{path}.plain.html`). Two things differ on the **published** site vs local preview:

- Published fragment `.plain.html` serves sections **directly under `<body>` with no `<main>` wrapper** →
  select `body > div` (fallback `main > div`).
- DA/EDS **strips all authoring `class`/`id`/`style` attributes** → detect sections **positionally**
  (index 0 = utility, 1 = brand, 2 = product for header; 0 = links, 1 = social, 2 = legal, 3 = copyright
  for footer), never by class name. Footer link columns flatten to bare `h3`+`ul` pairs, so footer.js
  re-groups them into column divs.

**Always verify header/footer/images on the published `aem.page` URL, not just localhost** — local
preview keeps classes and serves raw files, which masks all three quirks above.

## Local dev

- Preview server at `http://localhost:3000`. View a page at
  `http://localhost:3000/content/credit-cards/all-credit-cards-p`.
- Lint before pushing: `npx eslint blocks/**/*.js` and `npx stylelint blocks/**/*.css styles/*.css`.

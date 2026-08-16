# Personal Site Redesign — Design Spec

Date: 2026-08-16
Repo: `crqu.github.io` (Jekyll + al-folio, GitHub Pages)

## Goal

Replace the design layer of the site so it reads as deliberate rather than as an
unmodified al-folio install, and remove the upstream demo baggage from the repo.

The content pipeline is out of scope and must not change: `_bibliography/papers.bib`,
the `scholar:` block in `_config.yml`, and the citation plugins
(`google-scholar-citations.rb`, `inspirehep-citations.rb`, `hide-custom-bibtex.rb`)
keep working exactly as they do today.

## Problems being fixed

Observed by rendering the live site at 1440px and reading the result, plus a file audit.

Layout and spacing:

1. `max_width: 930px` yields ~95 characters per line in news rows, well past a
   comfortable 60–80 measure.
2. The profile photo is `float: right` inside the prose. It forces a ragged wrap in
   the "Research interests" paragraph and leaves a dead notch beneath itself before
   the News section.
3. Vertical rhythm is ad hoc. Subtitle→"About me" is much tighter than section→section,
   and section gaps are inconsistent with each other.

Typography and hierarchy:

4. Section headings are inconsistently cased: "latest posts" against "News" and
   "Selected Publications".
5. The News `<h2>` carries an inline `font-size: 0.8em` (`_layouts/about.liquid:44`),
   so it renders smaller than sibling headings for no reason.
6. The photo caption renders in monospace, matching nothing else on the page.
7. Body, headings, and nav share one system sans — no typographic contrast.

Color and chrome:

8. Links use al-folio's default magenta — the clearest "unmodified template" signal.
9. The footer is a full-bleed near-black bar under an otherwise white page: the
   visually heaviest element on the site, carrying a copyright line.

Publications:

10. Preview thumbnails have inconsistent aspect ratios, so the left rail is uneven.
11. The `ARXIV` link renders as a bare outlined box.

Repo hygiene (all verified against `git ls-files` and a reference grep):

12. 18 unused images in `assets/img/`: `1.jpg`–`12.jpg`, `photo.jpg`, `photo.png`,
    `prof_pic.jpg`, `prof_pic_color.png`, `chengrui-life.jpg`, `chengrui-round.png`.
    Zero references anywhere in the repo.
13. 18 tracked upstream demo files: `readme_preview/` (14), `lighthouse_results/` (4).
14. Upstream theme docs: `README.md`, `CUSTOMIZE.md`, `FAQ.md`, `INSTALL.md`,
    `CONTRIBUTING.md`.
15. A hardcoded ClustrMaps visitor-tracking `<script>` at the bottom of
    `_layouts/about.liquid`.

## Decisions

| Decision | Choice |
| --- | --- |
| Scope | Restyle al-folio in place; keep the jekyll-scholar pipeline |
| Home layout | Single column with a masthead header block |
| Visual voice | Quiet academic — serif headings, sans body, warm off-white, one accent |
| Publications | Keep thumbnails, normalize to a fixed 3:2 box |
| Header links | Email, Google Scholar, CV, GitHub, LinkedIn |
| INSPIRE-HEP | Removed (unrelated to CMS/RL work; template leftover) |
| Misc page | Uniform responsive grid with lightbox |
| Cleanup | Demo files, unused images, ClustrMaps, unused layouts — all deleted |

Identity values to wire in:

- `github_username: crqu`
- `linkedin_username: chengrui-qu-b75863318`
- `inspirehep_id:` — cleared
- Nickname "Ray" surfaced in the About paragraph (see §4).

## 1. Design tokens

All spacing, type, and color live in `_sass/_variables.scss` as custom properties.
No component may introduce a raw px value for spacing.

### Spacing — 4px base

```
--s1  .25rem    --s2  .5rem     --s3  .75rem    --s4  1rem
--s5  1.5rem    --s6  2rem      --s7  3rem      --s8  4rem
```

Fixed assignments, applied uniformly:

| Relationship | Token |
| --- | --- |
| Section → section | `--s8` |
| Section heading → its body | `--s4` |
| Paragraph → paragraph | `--s3` |
| List row → list row | `--s4` |
| Masthead photo → text block | `--s5` |

### Type

Newsreader for headings, Inter for body. Both self-hosted through the existing
`_plugins/download-3rd-party.rb` vendoring step, so there is no render-blocking
third-party font request. `JetBrains Mono` for code only — never captions.

| Role | Size | Family / weight | Notes |
| --- | --- | --- | --- |
| Name (h1) | 2.25rem | Newsreader 600 | `letter-spacing: -0.015em` |
| Section (h2) | 1.625rem | Newsreader 600 | |
| Sub (h3) | 1.125rem | Inter 600 | |
| Body | 1.0625rem | Inter 400 | `line-height: 1.65` |
| Meta | .875rem | Inter 400 | muted; `font-variant-numeric: tabular-nums` |

### Color

Same token names resolved per theme in `_sass/_themes.scss`.

| Token | Light | Dark |
| --- | --- | --- |
| `--ink` | `#1A1A1A` | `#E8E6E3` |
| `--ink-muted` | `#5C5C5C` | `#A09C96` |
| `--bg` | `#FDFCFA` | `#12110F` |
| `--rule` | `#E6E3DE` | `#2A2825` |
| `--accent` | `#1F5673` | `#7FB3D5` |

Accent is used on links only — never on headings, borders, or buttons. Both accent
pairings must clear WCAG AA, which the CI `axe` job checks.

## 2. Measure and container

- `--content-width: 46rem` (736px), replacing the effective 930px.
- Prose additionally capped at `68ch`.
- `site.max_width` in `_config.yml` → `760px`, because `_layouts/about.liquid` feeds
  it into responsive-image `sizes` calculations.

Expected effect: news rows drop from ~95 to ~72 characters per line.

## 3. Homepage layout

`_layouts/about.liquid` is rewritten.

**Masthead** (`.masthead`) — a flex row replacing the floated profile:

- 128px photo, `border-radius: 8px`, `flex: 0 0 auto`
- `gap: var(--s5)`
- Right side stacks: name (h1) → role line (meta) → icon row
- Icon row: 1.25rem icons, `gap: var(--s4)`, muted, accent on hover
- Below 600px the row becomes a column, photo left-aligned (not centered)

The `float-left`/`float-right` profile block and its `.clearfix` wrapper are removed
entirely.

**Sections** (`.section-head`) — Newsreader 1.625rem with a hairline `--rule` border
beneath spanning the full measure. `margin-top: var(--s8)`, `margin-bottom: var(--s4)`.
Uniformly title-cased: "About", "Research", "News", "Latest Posts",
"Selected Publications". The inline `font-size: 0.8em` at `_layouts/about.liquid:44`
is deleted.

**News** (`_includes/news.liquid`) — `display: grid`,
`grid-template-columns: 7.5rem 1fr`, `row-gap: var(--s4)`. Date is meta-styled with
tabular numerals so dates align optically. Below 600px, collapses to stacked with the
date above the item.

**ClustrMaps** — the `<script>` block at the bottom of the layout is deleted.

## 4. Content edits

`_pages/about.md`:

- Surface the nickname in the opening paragraph: after the Caltech affiliation
  sentence, "Most people call me Ray."
- Move the email out of prose (`cqu[at]caltech[dot]edu`) — it becomes a mailto icon
  in the masthead. The "happy to connect" sentence stays.
- `social: false` → the masthead icon row supersedes the al-folio social block, so the
  front-matter flag stays false and the icons are rendered by the masthead directly.

If the nickname reads better beside the name than in the paragraph, it can move to a
muted parenthetical in the masthead role line — a one-line change, decided by looking
at the rendered result.

## 5. Publications

Applies to both the homepage selection (`_includes/selected_papers.liquid`) and
`/publications/` (`_layouts/bib.liquid`).

- `display: grid`, `grid-template-columns: 120px 1fr`, `gap: var(--s5)`
- Thumbnail: `aspect-ratio: 3/2`, `object-fit: cover`, 1px `--rule` border, 4px radius.
  Even left rail regardless of source image dimensions.
- Title: 1.0625rem, weight 600, ink
- Authors: body size, muted. Author-name bolding stays with jekyll-scholar.
- Venue: muted italic
- Links: accent text separated by `·`, replacing the outlined `ARXIV` button
- Below 600px: thumbnail column drops to 88px

## 6. Chrome

**Navbar** (`_includes/header.liquid`) — transparent background, hairline `--rule`
bottom border, no shadow. Active item: `--ink` with a 2px underline at 4px offset.
Inactive: `--ink-muted`. Theme toggle inherits the icon-row treatment.

**Footer** (`_includes/footer.liquid`) — the dark bar is removed. Hairline `--rule` top
border, transparent background, `.875rem` muted text. `footer_fixed: false` in
`_config.yml`.

**Caption** — `.caption` drops monospace for muted sans at meta size.

## 7. Misc page

`_pages/misc.md` hand-written Bootstrap rows (column counts 2,2,2,1,2,2) are replaced
by a single grid:

- `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`, `gap: var(--s4)`
- Tiles `aspect-ratio: 3/2`, `object-fit: cover`, 4px radius
- Click opens the full-size image in a lightbox
- Trip captions grouped above each cluster, meta-styled

## 8. Cleanup

Delete:

- `readme_preview/` (14 files), `lighthouse_results/` (4 files)
- `README.md`, `CUSTOMIZE.md`, `FAQ.md`, `INSTALL.md`, `CONTRIBUTING.md`
- The 18 unused images listed in problem 12
- Layouts: `distill.liquid`, `cv.liquid`, `profiles.liquid`
- Includes: `repository/`, `resume/`, `cv/`, `projects.liquid`,
  `projects_horizontal.liquid`, `disqus.liquid`, `giscus.liquid`, `audio.liquid`,
  `video.liquid`
- Orphaned styles: `_sass/_distill.scss`, `_cv.scss`, `_tabs.scss`, `_typograms.scss`
- The `_projects/` collection and its `_config.yml` entry
- `_data/cv.yml` and `_data/repositories.yml` (orphaned once the cv/repository
  includes go). `_data/coauthors.yml` and `_data/venues.yml` stay — verify against
  jekyll-scholar usage before touching either.
- `.DS_Store` (untracked) plus a `.gitignore` entry to keep it out

Add: a short `README.md` describing this site and how to build it.

Constraint: every deletion must be verified unreferenced before removal. A layout or
include still named by any page's front matter or any `{% include %}` stays.

## 9. Risks

- **purgecss.** Production builds strip unused CSS by scanning content. Every new class
  name must appear literally in a template — no class names assembled in Liquid.
- **Cascade conflicts.** `_sass/_base.scss` is 1306 lines of upstream rules. New
  component styles must not be layered on top of conflicting old ones; the superseded
  rules get removed rather than overridden.
- **Deletion overreach.** Removing an include that is still referenced breaks the build.
  Mitigated by the grep-before-delete constraint above.
- **Font vendoring.** If `download-3rd-party.rb` cannot vendor Newsreader/Inter, fall
  back to a `<link>` with `preconnect` rather than shipping a render-blocking request.

## 10. Verification

Spacing and layout are the explicit priority, so verification is visual and mandatory —
no step is complete on reasoning alone.

1. `bundle exec jekyll build` succeeds with no warnings.
2. Headless Chrome screenshots of `/`, `/publications/`, `/blog/`, the blog post,
   `/misc/`, and `/news/` at 1440px and 390px, in both light and dark. Each screenshot
   is read back and checked against this spec.
3. Specific assertions to confirm in the rendered output:
   - No horizontal overflow at 390px on any page.
   - News rows measure under 80 characters per line.
   - All publication thumbnails share identical rendered dimensions.
   - Section gaps are equal down the homepage.
   - No magenta remains anywhere.
4. `npx prettier --write .` clean.
5. Links in the masthead resolve: mailto, Scholar, CV PDF, GitHub, LinkedIn.

## Out of scope

- `_bibliography/papers.bib` content
- jekyll-scholar configuration and the citation plugins
- The blog post's own content
- The `Chengrui-Academic-CV/` directory
- Adding new pages or new publications

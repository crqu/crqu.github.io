# Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visual design layer of `crqu.github.io` so it reads as deliberate rather than as an unmodified al-folio install, and strip the upstream demo baggage from the repo.

**Architecture:** al-folio's entire 1306-line `_sass/_base.scss` is driven by `--global-*` CSS custom properties. Rather than rewriting it, we define a new token layer in `_variables.scss`/`_themes.scss` and **remap the existing `--global-*` names onto the new tokens**. One change recolors the whole theme. New components (masthead, section heads, news grid, publication rows, photo grid) go in a new `_sass/_site.scss` imported last so it wins the cascade; superseded rules in `_base.scss` are deleted rather than overridden.

**Tech Stack:** Jekyll 4 + al-folio, jekyll-scholar, SCSS, Bootstrap 4 (theme dependency), Liquid, prettier 3.1.1 with `@shopify/prettier-plugin-liquid`.

**Spec:** `docs/superpowers/specs/2026-08-16-site-redesign-design.md`

## Global Constraints

- **No test suite exists.** Every task is verified by building the site, screenshotting in headless Chrome, and _reading the screenshot back_. A task is not complete on reasoning alone.
- **Spacing tokens only.** No raw px/rem spacing values in new CSS. Use `--s1`…`--s8`.
- **Accent on links only.** Never on headings, borders, or buttons.
- **purgecss runs in production** (`purgecss.config.js`). Every new class name must appear literally in a `.liquid`/`.md` file — never assemble class names in Liquid.
- **Grep before delete.** Before removing any layout, include, data file, or image, confirm zero references. A file still referenced stays.
- **Do not touch:** `_bibliography/papers.bib`, the `scholar:` block in `_config.yml`, `_plugins/google-scholar-citations.rb`, `_plugins/inspirehep-citations.rb`, `_plugins/hide-custom-bibtex.rb`, `Chengrui-Academic-CV/`.
- **Run `npx prettier --write .`** before every commit. CI enforces it.
- **Colors** (exact values):
  | Token | Light | Dark |
  | --- | --- | --- |
  | `--ink` | `#1A1A1A` | `#E8E6E3` |
  | `--ink-muted` | `#5C5C5C` | `#A09C96` |
  | `--bg` | `#FDFCFA` | `#12110F` |
  | `--rule` | `#E6E3DE` | `#2A2825` |
  | `--accent` | `#1F5673` | `#7FB3D5` |
- **Identity values:** `github_username: crqu`, `linkedin_username: chengrui-qu-b75863318`, `inspirehep_id:` cleared, email `cqu@caltech.edu`, nickname "Ray".

### Verification harness (used by every task)

Set once per session:

```bash
export SHOTS=/private/tmp/claude-501/-Users-chengruiqu-Documents-pages-crqu-github-io/c63c3570-3686-41e3-8487-7e9df0c3d93f/scratchpad
export CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Start the dev server once (leave running; Jekyll rebuilds on change):

```bash
cd /Users/chengruiqu/Documents/pages/crqu.github.io
bundle exec jekyll serve --detach --port 4000
```

Screenshot helper — **must screenshot `http://localhost:4000`, not `file://`**, because asset paths are root-absolute:

```bash
shoot() {  # shoot <name> <path> <width> <height> [dark]
  local theme_arg=""
  [ -n "$5" ] && theme_arg="--force-dark-mode"
  "$CHROME" --headless --disable-gpu --hide-scrollbars $theme_arg \
    --virtual-time-budget=4000 --window-size="$3,$4" \
    --screenshot="$SHOTS/$1.png" "http://localhost:4000$2" >/dev/null 2>&1
}
```

To capture dark mode reliably (al-folio stores the setting in `localStorage`, which headless flags do not set), append `?` and instead toggle via the `data-theme-setting` attribute is not possible headlessly — use this approach: temporarily set `html[data-theme="dark"]` by screenshotting with `--force-dark-mode` **and** confirming visually; if that fails, verify dark mode manually in a real browser and note it in the task.

After every `shoot`, **Read the PNG** and check it against the task's assertions.

---

### Task 1: Repo cleanup and config

Removes the upstream demo baggage and wires identity values. No visual change expected except the footer un-pinning and social links becoming available.

**Files:**

- Delete: `readme_preview/` (14 files), `lighthouse_results/` (4 files), `README.md`, `CUSTOMIZE.md`, `FAQ.md`, `INSTALL.md`, `CONTRIBUTING.md`
- Delete: `assets/img/{1..12}.jpg`, `assets/img/photo.jpg`, `assets/img/photo.png`, `assets/img/prof_pic.jpg`, `assets/img/prof_pic_color.png`, `assets/img/chengrui-life.jpg`, `assets/img/chengrui-round.png`
- Delete: `_layouts/distill.liquid`, `_layouts/cv.liquid`, `_layouts/profiles.liquid`
- Delete: `_includes/repository/`, `_includes/resume/`, `_includes/cv/`, `_includes/projects.liquid`, `_includes/projects_horizontal.liquid`, `_includes/disqus.liquid`, `_includes/giscus.liquid`, `_includes/audio.liquid`, `_includes/video.liquid`
- Delete: `_sass/_distill.scss`, `_sass/_cv.scss`, `_sass/_tabs.scss`, `_sass/_typograms.scss`
- Delete: `_data/cv.yml`, `_data/repositories.yml`
- Delete: `_projects/`
- Modify: `assets/css/main.scss` (import list)
- Modify: `_config.yml`
- Modify: `.gitignore`
- Create: `README.md`

**Interfaces:**

- Produces: a build with no `distill`/`cv`/`tabs`/`typograms` SCSS partials, `site.max_width == 760px`, `site.footer_fixed == false`, and populated `github_username`/`linkedin_username`.

- [ ] **Step 1: Verify every deletion target is unreferenced**

```bash
cd /Users/chengruiqu/Documents/pages/crqu.github.io
for n in distill cv profiles repository resume projects projects_horizontal disqus giscus audio video; do
  echo "--- $n"
  grep -rn "$n" --include='*.md' --include='*.liquid' --include='*.yml' --include='*.scss' \
    _pages _posts _news _layouts _includes _config.yml assets/css 2>/dev/null \
    | grep -v "^_layouts/$n.liquid" | grep -v "^_includes/$n" | head -5
done
```

Expected: matches only inside files that are themselves being deleted, plus `assets/css/main.scss` (handled in Step 3) and `_config.yml` `projects` collection (handled in Step 4). **If any surviving page references one of these, do not delete it — record the exception and continue.**

- [ ] **Step 2: Delete the files**

```bash
cd /Users/chengruiqu/Documents/pages/crqu.github.io
git rm -r -q readme_preview lighthouse_results
git rm -q README.md CUSTOMIZE.md FAQ.md INSTALL.md CONTRIBUTING.md
git rm -q assets/img/{1,2,3,4,5,6,7,8,9,10,11,12}.jpg
git rm -q assets/img/photo.jpg assets/img/photo.png assets/img/prof_pic.jpg \
           assets/img/prof_pic_color.png assets/img/chengrui-life.jpg assets/img/chengrui-round.png
git rm -q _layouts/distill.liquid _layouts/cv.liquid _layouts/profiles.liquid
git rm -r -q _includes/repository _includes/resume _includes/cv
git rm -q _includes/projects.liquid _includes/projects_horizontal.liquid \
          _includes/disqus.liquid _includes/giscus.liquid _includes/audio.liquid _includes/video.liquid
git rm -q _sass/_distill.scss _sass/_cv.scss _sass/_tabs.scss _sass/_typograms.scss
git rm -q _data/cv.yml _data/repositories.yml
git rm -r -q _projects 2>/dev/null || true
```

- [ ] **Step 3: Update the SCSS import list**

In `assets/css/main.scss`, replace the `@import` block with:

```scss
@import "variables", "themes", "layout", "base", "site", "font-awesome/fontawesome", "font-awesome/brands", "font-awesome/solid",
  "font-awesome/regular", "tabler-icons/tabler-icons.scss", "tabler-icons/tabler-icons-filled.scss", "tabler-icons/tabler-icons-outline.scss";
```

- [ ] **Step 4: Create the `_site.scss` stub so the build does not break**

Create `_sass/_site.scss`:

```scss
/*******************************************************************************
 * Site components. Imported last — this layer wins the cascade.
 ******************************************************************************/
```

- [ ] **Step 5: Edit `_config.yml`**

Apply these exact changes:

```yaml
# was: max_width: 930px
max_width: 760px

# was: footer_fixed: true
footer_fixed: false

# was: github_username:
github_username: crqu

# was: linkedin_username:
linkedin_username: chengrui-qu-b75863318

# was: inspirehep_id: 1010907
inspirehep_id:

# was: email: qcr2021@gmail.com
email: cqu@caltech.edu
```

Also delete the `projects:` entry from the `collections:` block.

- [ ] **Step 6: Add `.DS_Store` to `.gitignore`**

Append to `.gitignore` if not already present:

```
.DS_Store
```

- [ ] **Step 7: Write the new README**

Create `README.md`:

````markdown
# crqu.github.io

Personal academic website for Chengrui Qu — built with [Jekyll](https://jekyllrb.com/)
on a heavily customized [al-folio](https://github.com/alshedivat/al-folio) base,
hosted on GitHub Pages.

## Develop

```bash
bundle install
bundle exec jekyll serve      # http://localhost:4000
```
````

Requires Ruby, Bundler, and ImageMagick (for responsive image generation).

## Content

| What          | Where                                                   |
| ------------- | ------------------------------------------------------- |
| Landing page  | `_pages/about.md`                                       |
| Publications  | `_bibliography/papers.bib` (rendered by jekyll-scholar) |
| News items    | `_news/announcement_N.md`                               |
| Blog posts    | `_posts/`                                               |
| Photos page   | `_pages/misc.md`                                        |
| Design tokens | `_sass/_variables.scss`, `_sass/_themes.scss`           |
| Components    | `_sass/_site.scss`                                      |

## Deploy

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds with
`JEKYLL_ENV=production`, purges unused CSS, and publishes `_site/` to `gh-pages`.
Do not hand-edit `gh-pages`.

## Format

```bash
npx prettier --write .
```

````

- [ ] **Step 8: Build and verify**

```bash
cd /Users/chengruiqu/Documents/pages/crqu.github.io
bundle exec jekyll build 2>&1 | tail -20
````

Expected: `done in N seconds`, no `Liquid Exception`, no `Could not locate`. If the build fails on a missing include, the grep in Step 1 missed a reference — restore that one file with `git checkout HEAD -- <path>` and note it.

- [ ] **Step 9: Screenshot to confirm nothing regressed**

```bash
bundle exec jekyll serve --detach --port 4000
shoot t1_home / 1440 2400
```

Read `$SHOTS/t1_home.png`. Assertions:

- Page renders with all sections present (About, News, latest posts, Selected Publications).
- Footer is no longer a pinned black bar at the viewport bottom (it now sits at content end — still dark, that is fixed in Task 7).
- Content column is visibly narrower than before.

- [ ] **Step 10: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "chore: remove upstream al-folio demo files and wire identity config"
```

---

### Task 2: Design tokens and fonts

Establishes the token layer and remaps `--global-*` onto it. This single task kills the magenta site-wide.

**Files:**

- Modify: `_sass/_variables.scss`
- Modify: `_sass/_themes.scss:5-108`
- Create: `assets/fonts/` (woff2 files)
- Modify: `_sass/_site.scss`

**Interfaces:**

- Produces tokens consumed by every later task: `--s1`…`--s8`, `--ink`, `--ink-muted`, `--bg`, `--rule`, `--accent`, `--font-serif`, `--font-sans`, `--font-mono`, `--content-width`.

- [ ] **Step 1: Download the fonts**

```bash
cd /Users/chengruiqu/Documents/pages/crqu.github.io
mkdir -p assets/fonts
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
curl -s -A "$UA" \
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:wght@600&display=swap' \
  -o /tmp/gf.css
grep -o 'https://[^)]*\.woff2' /tmp/gf.css | sort -u
```

Download each URL into `assets/fonts/`, naming them `inter-400.woff2`, `inter-500.woff2`, `inter-600.woff2`, `newsreader-600.woff2`. Google returns one file per weight per unicode-range; **keep only the `latin` range files** (they are the ones preceded by `unicode-range: U+0000-00FF...` in `/tmp/gf.css`).

If the download fails (no network), fall back to adding to `_includes/head.liquid` inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Newsreader:wght@600&display=swap" rel="stylesheet" />
```

and skip Step 2.

- [ ] **Step 2: Declare the faces**

Prepend to `_sass/_site.scss` (before the comment banner):

```scss
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("../fonts/inter-400.woff2") format("woff2");
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("../fonts/inter-500.woff2") format("woff2");
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("../fonts/inter-600.woff2") format("woff2");
}
@font-face {
  font-family: "Newsreader";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("../fonts/newsreader-600.woff2") format("woff2");
}
```

- [ ] **Step 3: Add tokens to `_sass/_variables.scss`**

Append to the end of the file:

```scss
// ---------------------------------------------------------------------------
// Design tokens. Everything visual derives from these.
// ---------------------------------------------------------------------------

// Light palette
$ink-light: #1a1a1a;
$ink-muted-light: #5c5c5c;
$bg-light: #fdfcfa;
$rule-light: #e6e3de;
$accent-light: #1f5673;

// Dark palette
$ink-dark: #e8e6e3;
$ink-muted-dark: #a09c96;
$bg-dark: #12110f;
$rule-dark: #2a2825;
$accent-dark: #7fb3d5;
```

- [ ] **Step 4: Define and remap tokens in `_sass/_themes.scss`**

In the `:root` block, insert these lines immediately after `:root {`:

```scss
// --- Design tokens -------------------------------------------------------
--ink: #{$ink-light};
--ink-muted: #{$ink-muted-light};
--bg: #{$bg-light};
--rule: #{$rule-light};
--accent: #{$accent-light};

--font-serif: "Newsreader", Georgia, "Times New Roman", serif;
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;

--s1: 0.25rem;
--s2: 0.5rem;
--s3: 0.75rem;
--s4: 1rem;
--s5: 1.5rem;
--s6: 2rem;
--s7: 3rem;
--s8: 4rem;

--content-width: 46rem;
```

Then **replace** these existing `:root` lines (keep every other line as-is):

```scss
--global-bg-color: var(--bg);
--global-text-color: var(--ink);
--global-text-color-light: var(--ink-muted);
--global-theme-color: var(--accent);
--global-hover-color: var(--accent);
--global-footer-bg-color: transparent;
--global-footer-text-color: var(--ink-muted);
--global-footer-link-color: var(--ink);
--global-divider-color: var(--rule);
--global-card-bg-color: var(--bg);
--global-code-bg-color: rgba(0, 0, 0, 0.04);
```

In the `html[data-theme="dark"]` block, insert after the opening brace:

```scss
--ink: #{$ink-dark};
--ink-muted: #{$ink-muted-dark};
--bg: #{$bg-dark};
--rule: #{$rule-dark};
--accent: #{$accent-dark};
```

and **replace** these dark lines:

```scss
--global-bg-color: var(--bg);
--global-text-color: var(--ink);
--global-text-color-light: var(--ink-muted);
--global-theme-color: var(--accent);
--global-hover-color: var(--accent);
--global-footer-bg-color: transparent;
--global-footer-text-color: var(--ink-muted);
--global-footer-link-color: var(--ink);
--global-divider-color: var(--rule);
--global-card-bg-color: var(--bg);
--global-code-bg-color: rgba(255, 255, 255, 0.06);
```

Note: `--global-theme-color` was `$purple-color` (`#b509ac`). Remapping it is what removes the magenta everywhere at once.

- [ ] **Step 5: Set the base typography**

Append to `_sass/_site.scss`:

```scss
body {
  font-family: var(--font-sans);
  font-size: 1.0625rem;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.25;
  color: var(--ink);
}

h3,
h4,
h5,
h6 {
  font-family: var(--font-sans);
  letter-spacing: 0;
}

code,
pre {
  font-family: var(--font-mono);
}
```

- [ ] **Step 6: Build and screenshot**

```bash
bundle exec jekyll build 2>&1 | tail -5
shoot t2_home / 1440 2400
```

Read `$SHOTS/t2_home.png`. Assertions:

- **No magenta anywhere.** Links are deep slate-blue `#1F5673`.
- Background is warm off-white, not pure white.
- Headings render in a serif face; body in Inter.
- If headings still look like the old sans, the font files failed to load — check the browser network path `assets/fonts/*.woff2` resolves and fall back to the `<link>` method in Step 1.

- [ ] **Step 7: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "feat: add design token layer, remap theme variables, self-host fonts"
```

---

### Task 3: Container and measure

**Files:**

- Modify: `_sass/_layout.scss:30-39`
- Modify: `_sass/_site.scss`

**Interfaces:**

- Consumes: `--content-width`, `--s*` from Task 2.
- Produces: a `.container` capped at `--content-width`; `.post` prose capped at `68ch`.

- [ ] **Step 1: Cap the container**

In `_sass/_layout.scss`, replace:

```scss
.container {
  max-width: $max-content-width;
}

// Profile
.profile {
  img {
    width: 100%;
  }
}
```

with:

```scss
.container {
  max-width: var(--content-width);
}
```

The `.profile` block goes because Task 4 removes the floated profile entirely.

- [ ] **Step 2: Cap the prose measure**

Append to `_sass/_site.scss`:

```scss
.post > article > p,
.post > article > ul,
.post > article > ol,
.post > article > .clearfix > p,
.post > article > .clearfix > ul,
.post > article > .clearfix > ol {
  max-width: 68ch;
}
```

- [ ] **Step 3: Also remove the floated profile rules in `_base.scss`**

Delete the `.profile { ... }` block at `_sass/_base.scss:195` (through its closing brace, ending just before `.post-description` at line 230). Confirm the boundary first:

```bash
sed -n '195,232p' _sass/_base.scss
```

- [ ] **Step 4: Build and screenshot at both widths**

```bash
bundle exec jekyll build 2>&1 | tail -5
shoot t3_home /             1440 2400
shoot t3_home_m /            390 2600
shoot t3_pubs /publications/ 1440 2600
```

Read all three. Assertions:

- Content column is ~736px wide and centered at 1440px.
- **No horizontal overflow at 390px** — no content clipped at the right edge, no horizontal scrollbar artifact.
- News rows are under 80 characters per line.
- The profile photo may now render full-width and ugly. **That is expected** — Task 4 rebuilds it.

- [ ] **Step 5: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "feat: cap container to 46rem and prose to 68ch, drop floated profile"
```

---

### Task 4: Masthead and homepage content

Replaces the float-wrap with a flex header block, and adds the contact icon row.

**Files:**

- Modify: `_layouts/about.liquid` (full rewrite)
- Modify: `_pages/about.md`
- Modify: `_sass/_site.scss`

**Interfaces:**

- Consumes: tokens from Task 2, container from Task 3.
- Produces: `.masthead`, `.masthead-photo`, `.masthead-body`, `.masthead-name`, `.masthead-role`, `.masthead-links` — all consumed by nothing later, but the `.section-head` class it introduces is styled in Task 5.

- [ ] **Step 1: Rewrite `_layouts/about.liquid`**

Replace the entire file with:

```liquid
---
layout: default
---
<div class="post">
  <article>
    <div class="masthead">
      {% if page.profile.image %}
        {% assign profile_image_path = page.profile.image | prepend: 'assets/img/' %}
        <div class="masthead-photo">
          {%
            include figure.liquid loading="eager" path=profile_image_path class="masthead-img"
            sizes="128px" alt=page.profile.image cache_bust=true
          %}
        </div>
      {% endif %}

      <div class="masthead-body">
        <h1 class="masthead-name">
          {% if site.title == 'blank' %}
            {{ site.first_name }}
            {{ site.middle_name }}
            {{ site.last_name }}
          {% else %}
            {{ site.title }}
          {% endif %}
        </h1>
        <p class="masthead-role">{{ page.subtitle }}</p>

        <div class="masthead-links">
          <a href="mailto:{{ site.email }}" title="Email" aria-label="Email">
            <i class="fa-solid fa-envelope"></i>
          </a>
          {% if site.scholar_userid %}
            <a
              href="https://scholar.google.com/citations?user={{ site.scholar_userid }}"
              title="Google Scholar"
              aria-label="Google Scholar"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="ai ai-google-scholar"></i>
            </a>
          {% endif %}
          <a href="{{ '/assets/pdf/cv.pdf' | relative_url }}" title="CV" aria-label="CV">
            <i class="fa-solid fa-file-lines"></i>
          </a>
          {% if site.github_username %}
            <a
              href="https://github.com/{{ site.github_username }}"
              title="GitHub"
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="fa-brands fa-github"></i>
            </a>
          {% endif %}
          {% if site.linkedin_username %}
            <a
              href="https://www.linkedin.com/in/{{ site.linkedin_username }}"
              title="LinkedIn"
              aria-label="LinkedIn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="fa-brands fa-linkedin"></i>
            </a>
          {% endif %}
        </div>
      </div>
    </div>

    {{ content }}

    {% if page.news and site.announcements.enabled %}
      <h2 class="section-head">
        <a href="{{ '/news/' | relative_url }}">News</a>
      </h2>
      {% include news.liquid limit=true %}
    {% endif %}

    {% if site.latest_posts.enabled %}
      <h2 class="section-head">
        <a href="{{ '/blog/' | relative_url }}">Latest Posts</a>
      </h2>
      {% include latest_posts.liquid %}
    {% endif %}

    {% if page.selected_papers %}
      <h2 class="section-head">
        <a href="{{ '/publications/' | relative_url }}">Selected Publications</a>
      </h2>
      {% include selected_papers.liquid %}
    {% endif %}
  </article>
</div>
```

Changes embodied here: the floated `.profile` div is gone; `<header class="post-header">` is gone (the masthead replaces it); the `font-size: 0.8em` inline hack on the News heading is gone; `style="color: inherit"` inline hacks are gone (handled in CSS); "latest posts" is now "Latest Posts"; the ClustrMaps `<script>` is deleted; the `.social` block and newsletter block are removed (the masthead icon row supersedes them).

- [ ] **Step 2: Verify the academicons class actually loads**

```bash
grep -rn "academicons" _includes/head.liquid _includes/scripts/*.liquid assets/css/main.scss 2>/dev/null
```

If `academicons.min.css` is **not** referenced anywhere, replace `<i class="ai ai-google-scholar"></i>` in the layout with `<i class="fa-solid fa-graduation-cap"></i>`.

- [ ] **Step 3: Style the masthead**

Append to `_sass/_site.scss`:

```scss
.masthead {
  display: flex;
  align-items: flex-start;
  gap: var(--s5);
  margin-top: var(--s7);
  margin-bottom: var(--s8);
}

.masthead-photo {
  flex: 0 0 128px;
  width: 128px;
}

.masthead-img {
  width: 128px;
  height: 128px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

.masthead-body {
  min-width: 0;
}

.masthead-name {
  font-size: 2.25rem;
  margin: 0;
}

.masthead-role {
  font-size: 1.0625rem;
  color: var(--ink-muted);
  margin: var(--s2) 0 0;
}

.masthead-links {
  display: flex;
  align-items: center;
  gap: var(--s4);
  margin-top: var(--s4);
  font-size: 1.25rem;

  a {
    color: var(--ink-muted);
    text-decoration: none;

    &:hover {
      color: var(--accent);
    }
  }
}

@media (max-width: 600px) {
  .masthead {
    flex-direction: column;
    gap: var(--s4);
  }

  .masthead-name {
    font-size: 1.875rem;
  }
}
```

- [ ] **Step 4: Update `_pages/about.md`**

Replace the body (everything after the front matter) with:

```markdown
### About

I am a first-year PhD student in the [Caltech Rigorous Systems Research Group](http://rsrg.cms.caltech.edu), advised by [Prof. Adam Wierman](https://adamwierman.com) and [Prof. Eric Mazumdar](https://users.cms.caltech.edu/~mazumdar/) at the [Computing + Mathematical Sciences (CMS) Department](https://www.cms.caltech.edu), [California Institute of Technology](https://www.caltech.edu). Most people call me Ray. Before joining Caltech, I obtained my B.Sc. degree at Peking University.

### Research

My research interests lie at the intersection of theoretical foundations for sequential decision-making, multi-agent systems, and the reasoning abilities of large language models, with a strong interest in real-world impact and practical applications. I'm always happy to connect — feel free to reach out if you'd like to discuss research, collaborations, or entrepreneurial opportunities.
```

Also change the front matter `more_info` to remove the now-unused caption (the masthead has no caption slot):

```yaml
profile:
  align: right
  image: pic.png
  image_circular: false
```

The email sentence and the CV link are removed from prose because both are now masthead icons.

- [ ] **Step 5: Make the markdown `###` headings use `.section-head` styling**

The About/Research headings come from markdown as `<h3>`. Append to `_sass/_site.scss`:

```scss
.post > article > h2.section-head,
.post > article > h3 {
  font-family: var(--font-serif);
  font-size: 1.625rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  border-bottom: 1px solid var(--rule);
  padding-bottom: var(--s2);
  margin-top: var(--s8);
  margin-bottom: var(--s4);

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--accent);
    }
  }
}
```

- [ ] **Step 6: Build and screenshot**

```bash
bundle exec jekyll build 2>&1 | tail -5
shoot t4_home  / 1440 2400
shoot t4_home_m / 390 2800
```

Read both. Assertions:

- Photo is a 128×128 rounded square at top-left, name and role to its right, five icons beneath the role.
- **No text wraps around the photo anywhere.** Every paragraph starts at the same left edge.
- All five section headings ("About", "Research", "News", "Latest Posts", "Selected Publications") render at the same size with a hairline rule beneath.
- Gaps between sections are visually equal.
- At 390px the masthead stacks vertically, photo left-aligned, and nothing overflows.
- The ClustrMaps widget is gone.

- [ ] **Step 7: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "feat: replace floated profile with masthead header block"
```

---

### Task 5: News and Latest Posts grids

Replaces the Bootstrap `<table>` markup with a CSS grid.

**Files:**

- Modify: `_includes/news.liquid`
- Modify: `_includes/latest_posts.liquid`
- Modify: `_sass/_site.scss`

**Interfaces:**

- Consumes: `.section-head` from Task 4.
- Produces: `.entry-list`, `.entry-date`, `.entry-body` — reused by nothing later.

- [ ] **Step 1: Rewrite `_includes/news.liquid`**

```liquid
<div class="news">
  {% if site.news != blank %}
    {% assign news_size = site.news | size %}
    {% assign news = site.news | reverse %}
    {% if include.limit and site.announcements.limit %}
      {% assign news_limit = site.announcements.limit %}
    {% else %}
      {% assign news_limit = news_size %}
    {% endif %}
    <div class="entry-list">
      {% for item in news limit: news_limit %}
        <div class="entry-date">{{ item.date | date: '%b %Y' }}</div>
        <div class="entry-body">
          {% if item.inline %}
            {{ item.content | remove: '<p>' | remove: '</p>' | emojify }}
          {% else %}
            <a href="{{ item.url | relative_url }}">{{ item.title }}</a>
          {% endif %}
        </div>
      {% endfor %}
    </div>
  {% else %}
    <p>No news so far...</p>
  {% endif %}
</div>
```

Note the date format changes from `%b %d, %Y` to `%b %Y` — the day adds noise without information for news items and is what pushes the date column wide.

- [ ] **Step 2: Rewrite `_includes/latest_posts.liquid`**

```liquid
<div class="news">
  {% if site.latest_posts != blank %}
    {% assign latest_posts_size = site.posts | size %}
    {% if site.latest_posts.limit %}
      {% assign latest_posts_limit = site.latest_posts.limit %}
    {% else %}
      {% assign latest_posts_limit = latest_posts_size %}
    {% endif %}
    <div class="entry-list">
      {% for item in site.posts limit: latest_posts_limit %}
        <div class="entry-date">{{ item.date | date: '%b %Y' }}</div>
        <div class="entry-body">
          {% if item.redirect == blank %}
            <a href="{{ item.url | relative_url }}">{{ item.title }}</a>
          {% elsif item.redirect contains '://' %}
            <a href="{{ item.redirect }}" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
          {% else %}
            <a href="{{ item.redirect | relative_url }}">{{ item.title }}</a>
          {% endif %}
        </div>
      {% endfor %}
    </div>
  {% else %}
    <p>No posts so far...</p>
  {% endif %}
</div>
```

- [ ] **Step 3: Style the grid**

Append to `_sass/_site.scss`:

```scss
.entry-list {
  display: grid;
  grid-template-columns: 6rem 1fr;
  column-gap: var(--s5);
  row-gap: var(--s4);
  align-items: baseline;
}

.entry-date {
  font-size: 0.875rem;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.entry-body {
  max-width: 68ch;

  p {
    margin: 0;
  }
}

@media (max-width: 600px) {
  .entry-list {
    grid-template-columns: 1fr;
    row-gap: var(--s2);
  }

  .entry-date {
    margin-top: var(--s3);
  }

  .entry-body {
    margin-bottom: var(--s2);
  }
}
```

- [ ] **Step 4: Remove the scrollable-container styles that no longer apply**

The `style="max-height: 60vw"` wrappers are gone from both includes, so `site.announcements.scrollable` and `site.latest_posts.scrollable` are now inert. Set both to `false` in `_config.yml` so the config does not lie:

```yaml
announcements:
  enabled: true
  scrollable: false
  limit: 5

latest_posts:
  enabled: true
  scrollable: false
  limit: 3
```

- [ ] **Step 5: Build and screenshot**

```bash
bundle exec jekyll build 2>&1 | tail -5
shoot t5_home  / 1440 2400
shoot t5_home_m / 390 2800
shoot t5_news /news/ 1440 1800
```

Read all three. Assertions:

- News dates form a clean left column; all dates left-aligned with each other.
- No inner scrollbar on the news block.
- News body text is under 80 characters per line.
- `/news/` renders the full list in the same grid.
- At 390px the date sits above its item, stacked, with clear separation between entries.

- [ ] **Step 6: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "feat: replace news and posts tables with a CSS grid"
```

---

### Task 6: Publications

**Files:**

- Modify: `_layouts/bib.liquid:3,48` (grid wrapper classes)
- Modify: `_sass/_base.scss:659-871` (the `.publications` block)
- Modify: `_sass/_site.scss`

**Interfaces:**

- Consumes: tokens from Task 2.
- Produces: `.pub-entry`, `.pub-thumb`, `.pub-body` used on both the homepage and `/publications/`.

- [ ] **Step 1: Inspect the full existing `.publications` block before editing**

```bash
sed -n '659,875p' _sass/_base.scss
```

Note where the block ends (the line before `.post {` at 872).

- [ ] **Step 2: Convert the Bootstrap row to a grid in `_layouts/bib.liquid`**

Change line 3 from:

```liquid
<div class="row">
```

to:

```liquid
<div class="pub-entry">
```

Change line 5 from:

```liquid
    <div class="col col-sm-2 abbr">
```

to:

```liquid
    <div class="pub-thumb abbr">
```

Change line 48 from:

```liquid
  <div id="{{ entry.key }}" class="{% if site.enable_publication_thumbnails %}col-sm-8{% else %}col-sm-10{% endif %}">
```

to:

```liquid
  <div id="{{ entry.key }}" class="pub-body">
```

Leave every other line of the file alone — the author loop, coauthor linking, and `more-authors` logic all stay.

- [ ] **Step 3: Delete the superseded `.publications` rules**

In `_sass/_base.scss`, inside the `.publications` block, delete these nested rules entirely (they conflict with the new layer): the `h1`, `h2`, `h2.bibliography` rules, and inside `ol.bibliography li` the `.preview`, `.abbr`, `.title`, and `.links a.btn` rules. **Keep** the `.author` rules — the coauthor link and `more-authors` styling still apply.

Verify nothing else in the repo depends on what you removed:

```bash
grep -rn "h2.bibliography\|a\.btn" _layouts _includes _pages | head
```

- [ ] **Step 4: Add the new publication styles**

Append to `_sass/_site.scss`:

```scss
.publications {
  margin-top: 0;

  ol.bibliography {
    list-style: none;
    padding: 0;
    margin: 0;

    > li {
      margin-bottom: var(--s6);
    }
  }
}

.pub-entry {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--s5);
  align-items: start;
}

.pub-thumb {
  img,
  .preview {
    width: 100%;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    border: 1px solid var(--rule);
    border-radius: 4px;
    display: block;
    background-color: var(--bg);
  }

  abbr {
    display: none;
  }
}

.pub-body {
  min-width: 0;

  .title {
    font-size: 1.0625rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--ink);
    margin-bottom: var(--s2);
  }

  .author {
    font-size: 1rem;
    color: var(--ink-muted);
    margin-bottom: var(--s1);
  }

  .periodical {
    font-size: 0.9375rem;
    font-style: italic;
    color: var(--ink-muted);
  }

  .links {
    margin-top: var(--s2);
    display: flex;
    flex-wrap: wrap;
    gap: var(--s3);

    a {
      font-size: 0.875rem;
      color: var(--accent);
      border: none;
      padding: 0;
      background: none;
      text-transform: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media (max-width: 600px) {
  .pub-entry {
    grid-template-columns: 88px 1fr;
    gap: var(--s4);
  }
}
```

Note `.pub-thumb abbr { display: none }` — the venue badge duplicates the `periodical` line and is what made the left rail busy. If you would rather keep it, delete that rule and give it accent-free styling instead.

- [ ] **Step 5: Check for the `.btn` class fighting back**

Bootstrap's `.btn` still applies to the link elements. Confirm the new `.links a` rules win:

```bash
bundle exec jekyll build 2>&1 | tail -5
shoot t6_pubs /publications/ 1440 3000
```

Read it. If the links still render as outlined boxes, Bootstrap's specificity is higher — add `.pub-body .links a.btn` as the selector instead of `.pub-body .links a`.

- [ ] **Step 6: Screenshot both surfaces**

```bash
shoot t6_home / 1440 2400
shoot t6_pubs_m /publications/ 390 3600
```

Read all three from Steps 5–6. Assertions:

- **Every thumbnail is exactly the same rendered size**, 3:2, with a hairline border.
- The left rail of thumbnails is perfectly even down the page.
- `ARXIV` outlined boxes are gone; links are plain accent text.
- Your own name is still bolded in each author list (jekyll-scholar behavior preserved).
- Venue line is muted italic.
- At 390px nothing overflows and thumbnails shrink to 88px.

- [ ] **Step 7: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "feat: normalize publication entries to a fixed-thumbnail grid"
```

---

### Task 7: Navbar, footer, captions

**Files:**

- Modify: `_sass/_base.scss:246-268` (`.navbar`), `:438-471` (`footer`), `:160-168` (`.caption`)
- Modify: `_includes/footer.liquid`
- Modify: `_sass/_site.scss`

**Interfaces:**

- Consumes: tokens from Task 2.

- [ ] **Step 1: Read the blocks you are about to change**

```bash
sed -n '160,169p;246,270p;438,472p' _sass/_base.scss
```

- [ ] **Step 2: Simplify the footer markup**

`footer_fixed` is already `false` (Task 1), so the `fixed-bottom` branch is dead. Replace `_includes/footer.liquid` entirely with:

```liquid
<footer class="sticky-bottom" role="contentinfo">
  <div class="container">
    &copy; {{ site.time | date: '%Y' }}
    {{ site.first_name }}
    {{ site.last_name }}
    {% if site.last_updated %}
      &middot; Last updated {{ 'now' | date: '%B %Y' }}
    {% endif %}
  </div>
</footer>
```

The al-folio attribution moves to the README (it is already there from Task 1), and `site.footer_text` becomes unused — clear it in `_config.yml`:

```yaml
footer_text:
```

- [ ] **Step 3: Style the chrome**

Append to `_sass/_site.scss`:

```scss
.navbar {
  background-color: var(--bg) !important;
  border-bottom: 1px solid var(--rule);
  box-shadow: none !important;
  padding-top: var(--s3);
  padding-bottom: var(--s3);

  .navbar-brand {
    font-family: var(--font-serif);
    font-weight: 600;
    color: var(--ink);
  }

  .nav-item {
    .nav-link {
      color: var(--ink-muted);
      padding: 0 0 var(--s1);
      margin-left: var(--s4);
      border-bottom: 2px solid transparent;

      &:hover {
        color: var(--ink);
      }
    }

    &.active .nav-link {
      color: var(--ink);
      border-bottom-color: var(--ink);
      font-weight: 500;
    }
  }
}

footer.sticky-bottom {
  background-color: transparent;
  border-top: 1px solid var(--rule);
  margin-top: var(--s8);
  padding: var(--s5) 0;
  font-size: 0.875rem;
  color: var(--ink-muted);

  a {
    color: var(--ink-muted);
  }
}

.caption {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  color: var(--ink-muted);
  margin-top: var(--s2);
  text-align: left;
}
```

- [ ] **Step 4: Delete the conflicting old rules**

In `_sass/_base.scss`:

- In the `.caption` block at line 160, delete the `font-family: monospace;` line (line 201 is inside a different block — confirm with the `sed` output from Step 1 which line belongs to `.caption`) and any `text-align: center`.
- In `footer.sticky-bottom` at line 459, delete `background-color` and any `color` declarations so the new layer is not fighting them.
- Delete the entire `footer.fixed-bottom` block at line 438 — the markup that used it is gone.

- [ ] **Step 5: Build and screenshot, light and dark**

```bash
bundle exec jekyll build 2>&1 | tail -5
shoot t7_home  / 1440 2400
shoot t7_blog  /blog/ 1440 1600
shoot t7_dark  / 1440 2400 dark
```

Read all three. Assertions:

- Navbar is off-white with a hairline bottom rule, no shadow, no magenta.
- Active nav item is ink with a 2px underline; others are muted.
- Footer is a hairline rule with muted small text — **the black bar is gone**.
- Photo caption is muted sans, not monospace.
- In dark mode: background is near-black warm, text is `#E8E6E3`, links are `#7FB3D5`, and the footer is not an inverted light bar. If `--force-dark-mode` did not actually trigger the theme, verify dark mode by hand in a real browser and record the result.

- [ ] **Step 6: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "feat: flatten navbar and footer chrome, fix caption typography"
```

---

### Task 8: Misc photo grid

**Files:**

- Modify: `_pages/misc.md` (full rewrite of the body)
- Modify: `_sass/_site.scss`

**Interfaces:**

- Consumes: tokens from Task 2.
- Produces: `.photo-grid`, `.photo-group`, `.photo-group-caption`.

- [ ] **Step 1: Confirm the lightbox library is already loaded**

al-folio ships `medium-zoom` and `figure.liquid` supports `zoomable=true` (used by `bib.liquid:39`). Confirm:

```bash
grep -rn "medium.zoom\|medium_zoom" _includes/scripts/*.liquid _includes/figure.liquid | head
```

If present, use `zoomable=true` on each figure and no new dependency is needed. If absent, drop the lightbox — the grid alone satisfies the spec's main goal — and note it.

- [ ] **Step 2: Rewrite the body of `_pages/misc.md`**

Keep the front matter as-is. Replace everything after it with:

```markdown
In my free time, I enjoy snowboarding. Here are a few pictures of me and my friends on the slopes or chair lifts. If you're interested in learning more about snowboarding, feel free to ask — it's so much fun!

<div class="photo-group">
  <p class="photo-group-caption">Thaiwoo, December 2024</p>
  <div class="photo-grid">
    {% include figure.liquid loading="lazy" path="assets/img/snow1.jpg" class="photo" zoomable=true alt="Snowboarding at Thaiwoo" %}
    {% include figure.liquid loading="lazy" path="assets/img/snow2.jpg" class="photo" zoomable=true alt="Snowboarding at Thaiwoo" %}
  </div>
</div>

<div class="photo-group">
  <p class="photo-group-caption">Fulong, December 2024</p>
  <div class="photo-grid">
    {% include figure.liquid loading="lazy" path="assets/img/snow3.jpg" class="photo" zoomable=true alt="Snowboarding at Fulong" %}
    {% include figure.liquid loading="lazy" path="assets/img/snow4.jpg" class="photo" zoomable=true alt="Snowboarding at Fulong" %}
  </div>
</div>

<div class="photo-group">
  <p class="photo-group-caption">Sunset at Nanshan, December 2024</p>
  <div class="photo-grid">
    {% include figure.liquid loading="lazy" path="assets/img/snow5.jpg" class="photo" zoomable=true alt="Sunset at Nanshan" %}
    {% include figure.liquid loading="lazy" path="assets/img/snow6.jpg" class="photo" zoomable=true alt="Sunset at Nanshan" %}
  </div>
</div>

<div class="photo-group">
  <p class="photo-group-caption">My first attempt at a grab — it did not go well. January 2025</p>
  <div class="photo-grid">
    {% include figure.liquid loading="lazy" path="assets/img/snow7.jpg" class="photo" zoomable=true alt="Attempting a grab" %}
  </div>
</div>

<div class="photo-group">
  <p class="photo-group-caption">New friends at Beidahu, February 2025</p>
  <div class="photo-grid">
    {% include figure.liquid loading="lazy" path="assets/img/snow8.jpg" class="photo" zoomable=true alt="At Beidahu" %}
    {% include figure.liquid loading="lazy" path="assets/img/snow9.jpg" class="photo" zoomable=true alt="At Beidahu" %}
  </div>
</div>

<div class="photo-group">
  <p class="photo-group-caption">Carving at Yunding Snow Park, February 2025</p>
  <div class="photo-grid">
    {% include figure.liquid loading="lazy" path="assets/img/snow10.jpg" class="photo" zoomable=true alt="Carving at Yunding" %}
    {% include figure.liquid loading="lazy" path="assets/img/snow11.jpg" class="photo" zoomable=true alt="Carving at Yunding" %}
  </div>
</div>
```

Every `<div class="row">` / `col-sm mt-3 mt-md-0` and every `<div class="caption">` is gone. Alt text is now descriptive instead of `"snowboard 3"` repeated — the CI `axe` job checks this.

- [ ] **Step 3: Style the grid**

Append to `_sass/_site.scss`:

```scss
.photo-group {
  margin-top: var(--s7);
}

.photo-group-caption {
  font-size: 0.875rem;
  color: var(--ink-muted);
  margin-bottom: var(--s3);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--s4);

  figure {
    margin: 0;
  }

  img {
    width: 100%;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    border-radius: 4px;
    display: block;
  }
}
```

- [ ] **Step 4: Build and screenshot**

```bash
bundle exec jekyll build 2>&1 | tail -5
shoot t8_misc  /misc/ 1440 3400
shoot t8_misc_m /misc/ 390 5200
```

Read both. Assertions:

- All tiles are identical size, 3:2, in an even grid.
- The single-photo group (grab attempt) renders as one tile at grid-column width, not stretched full-bleed.
- Group captions sit above their cluster, muted.
- At 390px the grid is one column with no overflow.
- Clicking a photo opens a zoom overlay (verify by confirming `medium-zoom` JS is present in the built HTML: `grep -c medium-zoom _site/misc/index.html`).

- [ ] **Step 5: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "feat: rebuild misc page as a uniform photo grid"
```

---

### Task 9: Blog pages and full verification sweep

**Files:**

- Modify: `_sass/_base.scss:524-610` (`.tag-category-list`, `.post-title`, `.post-list`, `.pagination`)
- Modify: `_sass/_site.scss`

**Interfaces:**

- Consumes: everything prior. Produces the final verified state.

- [ ] **Step 1: Read the blog-related blocks**

```bash
sed -n '524,612p' _sass/_base.scss
```

- [ ] **Step 2: Style the blog list and post**

Append to `_sass/_site.scss`:

```scss
.post-list {
  list-style: none;
  padding: 0;
  margin: 0;

  > li {
    margin-bottom: var(--s6);
    padding-bottom: var(--s6);
    border-bottom: 1px solid var(--rule);

    &:last-child {
      border-bottom: none;
    }

    h3 {
      font-family: var(--font-serif);
      font-size: 1.375rem;
      margin: 0 0 var(--s2);
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  .post-meta {
    font-size: 0.875rem;
    color: var(--ink-muted);
    font-variant-numeric: tabular-nums;
    margin: 0 0 var(--s2);
  }

  .post-description {
    color: var(--ink-muted);
    max-width: 68ch;
    margin: 0;
  }

  a.post-title {
    color: var(--ink);
    text-decoration: none;

    &:hover {
      color: var(--accent);
    }
  }
}

.post .post-header {
  margin-bottom: var(--s7);

  .post-title {
    font-family: var(--font-serif);
    font-size: 2.25rem;
    line-height: 1.2;
  }

  .post-meta,
  .post-tags {
    font-size: 0.875rem;
    color: var(--ink-muted);
  }
}
```

- [ ] **Step 3: Remove conflicting rules**

In `_sass/_base.scss`, delete any `color` and `font-size` declarations inside `.post-title` (line 543) and `.post-list` (line 549) that fight the new layer. Leave `.pagination` and `.tag-category-list` alone unless the screenshot in Step 4 shows a problem.

- [ ] **Step 4: Full sweep — every page, both widths, both themes**

```bash
bundle exec jekyll build 2>&1 | tail -5
shoot f_home    /                              1440 2400
shoot f_pubs    /publications/                 1440 3000
shoot f_blog    /blog/                         1440 1600
shoot f_post    /blog/2026/rsi-submartingale/  1440 3000
shoot f_misc    /misc/                         1440 3400
shoot f_news    /news/                         1440 2000
shoot f_home_m  /                               390 2800
shoot f_pubs_m  /publications/                  390 3600
shoot f_blog_m  /blog/                          390 1800
shoot f_post_m  /blog/2026/rsi-submartingale/   390 4000
shoot f_misc_m  /misc/                          390 5200
shoot f_news_m  /news/                          390 2600
shoot f_home_d  /                              1440 2400 dark
shoot f_pubs_d  /publications/                 1440 3000 dark
```

Confirm the post URL first:

```bash
ls _site/blog/2026/
```

**Read every single screenshot.** For each, check:

| #   | Assertion                                                   |
| --- | ----------------------------------------------------------- |
| 1   | No horizontal overflow at 390px                             |
| 2   | No magenta anywhere                                         |
| 3   | Section gaps equal down the homepage                        |
| 4   | All publication thumbnails identical size                   |
| 5   | News rows under 80 characters per line                      |
| 6   | Footer is a hairline, not a bar, on every page              |
| 7   | Navbar active state correct on each page                    |
| 8   | Dark mode legible; no inverted light blocks                 |
| 9   | Math renders correctly in the blog post (MathJax untouched) |
| 10  | No orphaned whitespace where deleted elements used to be    |

- [ ] **Step 5: Check the production build path**

purgecss only runs in the deploy workflow, so verify locally that the new class names survive:

```bash
cd /Users/chengruiqu/Documents/pages/crqu.github.io
JEKYLL_ENV=production bundle exec jekyll build 2>&1 | tail -5
npx purgecss --config purgecss.config.js --output /tmp/purged/ 2>&1 | tail -5
for c in masthead masthead-links entry-list entry-date pub-entry pub-thumb pub-body photo-grid photo-group section-head; do
  printf "%-18s %s\n" "$c" "$(grep -c "$c" /tmp/purged/*.css 2>/dev/null | head -1)"
done
```

Expected: every class has a nonzero count. A zero means purgecss stripped it and it will break in production — find where the class name is missing from the templates and fix it.

- [ ] **Step 6: Formatting and link check**

```bash
npx prettier --check . 2>&1 | tail -20
grep -o 'href="[^"]*"' _site/index.html | sort -u | head -40
```

Confirm the masthead links resolve: `mailto:cqu@caltech.edu`, `scholar.google.com/citations?user=qc6CJjYAAAAJ`, `/assets/pdf/cv.pdf`, `github.com/crqu`, `linkedin.com/in/chengrui-qu-b75863318`.

```bash
test -f assets/pdf/cv.pdf && echo "CV present" || echo "CV MISSING"
```

- [ ] **Step 7: Commit**

```bash
npx prettier --write . >/dev/null
git add -A
git commit -m "feat: restyle blog list and post header; final verification sweep"
```

- [ ] **Step 8: Stop the dev server**

```bash
pkill -f "jekyll serve" || true
```

---

## Self-review notes

**Spec coverage:** §1 tokens → Task 2. §2 measure → Task 3. §3 homepage → Tasks 4, 5. §4 content edits → Task 4 Step 4. §5 publications → Task 6. §6 chrome → Task 7. §7 misc → Task 8. §8 cleanup → Task 1. §9 risks → purgecss checked in Task 9 Step 5; cascade conflicts handled by explicit delete steps in Tasks 3, 6, 7, 9; deletion overreach guarded by Task 1 Step 1; font fallback in Task 2 Step 1. §10 verification → every task, plus the Task 9 sweep.

**Known gap accepted:** headless dark-mode capture is unreliable because al-folio reads the theme from `localStorage`. Tasks 7 and 9 instruct falling back to manual verification rather than silently passing.

**Not covered by any task, by design:** `_bibliography/papers.bib`, jekyll-scholar config, citation plugins, `Chengrui-Academic-CV/`, blog post content.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Chengrui Qu's personal academic website (https://crqu.github.io), built on the **al-folio** Jekyll theme and hosted on GitHub Pages. In day-to-day use this is a content repo: most changes are edits to bibliography, news, and the about page rather than to theme code. The bulk of the files (`_layouts/`, `_includes/`, `_sass/`, `_plugins/`, root `*.md` docs like `README.md`/`CUSTOMIZE.md`/`FAQ.md`/`INSTALL.md`) are upstream theme machinery — touch them only when intentionally customizing the theme.

## Common commands

Local development (Ruby + Jekyll):

```bash
bundle install                      # install gems (first time)
bundle exec jekyll serve            # serve with live reload at http://localhost:4000
bundle exec jekyll build            # one-off build into _site/
```

ImageMagick is also required (for responsive image generation).

Docker (no local Ruby needed):

```bash
docker compose up                   # uses prebuilt image, serves at :8080
docker compose -f docker-compose-slim.yml up   # builds locally from Dockerfile
```

Formatting (enforced on the theme; run before committing):

```bash
npx prettier --write .              # prettier 3.1.1 + @shopify/prettier-plugin-liquid, printWidth 150
```

There is no test suite. CI runs `prettier`, `lighthouse`, `axe` (accessibility), and broken-link checks (see `.github/workflows/`).

## Deployment

Push to `master` triggers `.github/workflows/deploy.yml`: it runs `jekyll build` with `JEKYLL_ENV=production`, purges unused CSS via `purgecss`, and publishes `_site/` to the `gh-pages` branch (served by GitHub Pages). Only changes to content/asset paths trigger it (see the `paths:` filter in the workflow). Do **not** hand-edit `gh-pages` — it is generated. `bin/deploy` exists for manual deploys but the GitHub Action is the normal path.

## Where content lives

- `_pages/` — site pages: `about.md` (the landing page, `permalink: /`, `layout: about`; bio, research interests, news/selected-papers toggles in front matter), plus `publications.md`, `misc.md`, `news.md`, `404.md`. Only pages with `nav: true` in front matter appear in the navbar.
- `_bibliography/papers.bib` — **all publications**. The top of the file is a large block of `@string{...}` venue abbreviations (shared with the upstream theme); add new entries below. al-folio–specific BibTeX fields: `abbr`, `selected={true}` (shows on homepage), `preview` (image in `assets/img/publication_preview/`), `abstract`, `bibtex_show`, `html`, `pdf`, `code`, `award`, etc. These keys are stripped from rendered BibTeX via `filtered_bibtex_keywords` in `_config.yml`.
- `_news/announcement_*.md` — news items shown on the homepage (newest by date; `announcements.limit: 5` in `_config.yml`). Front matter: `layout: post`, `date: YYYY-MM-DD`, `inline: true`.
- `_projects/`, `_posts/` — project cards and blog posts (currently mostly upstream demo content).
- `_data/` — `coauthors.yml`, `cv.yml`, `repositories.yml`, `venues.yml`.
- `assets/` — images (`assets/img/`), PDFs (`assets/pdf/cv.pdf`), JS/CSS.

Site-wide settings (identity, social links, theme toggles, scholar config) live in `_config.yml`. Changing `_config.yml` requires restarting `jekyll serve`.

## Bibliography rendering (jekyll-scholar)

Publications are rendered by **jekyll-scholar** (`scholar:` block in `_config.yml`), styled APA, author name `Chengrui Qu` is auto-bolded (`last_name: [Qu]`, `first_name: [Chengrui]`). Citation counts are fetched at build time by custom plugins. Several `_plugins/*.rb` are project-specific theme extensions worth knowing about:

- `google-scholar-citations.rb` / `inspirehep-citations.rb` — pull live citation counts.
- `hide-custom-bibtex.rb` — strips internal-only BibTeX keywords from output.
- `download-3rd-party.rb` — vendors external JS/CSS assets at build time.
- `cache-bust.rb`, `details.rb`, `external-posts.rb`, `file-exists.rb`, `remove-accents.rb`.

## Conventions

- BibTeX keys: `<firstauthor><year><shortname>` (e.g. `qu2024HTRL`, `yang2026MALLM`). Keys must be unique — duplicates cause one entry to shadow the other.
- Use `arxiv={NNNN.NNNNN}` for arXiv links (just the ID, not the full URL).
- The `journal` field doubles as venue/status display text (e.g. `ICLR`, `AISTATS (oral, top 2%)`, `arXiv preprint`).
- When adding a publication with a preview image, place the image in `assets/img/publication_preview/` and reference it via the `preview=` BibTeX field.
- Liquid templates use the `.liquid` extension (e.g. `_layouts/about.liquid`) and are prettier-formatted.
- The default git branch is `master`; commit and push only when asked.

## Common tasks

- **Add a paper:** add a BibTeX entry to `_bibliography/papers.bib`; set `selected={true}` to show it on the homepage; add a preview image to `assets/img/publication_preview/`.
- **Add news:** create `_news/announcement_N.md` with the front matter above.
- **Update CV:** replace `assets/pdf/cv.pdf`.

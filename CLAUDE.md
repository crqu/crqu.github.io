# CLAUDE.md

## Project overview

Personal academic website for Chengrui Qu (crqu.github.io). Built with Jekyll using the [al-folio](https://github.com/alshedivat/al-folio) theme. Deployed via GitHub Pages.

## Site structure

- `_pages/` — Site pages: `about.md` (homepage at `/`), `publications.md`, `misc.md`, `news.md`, `404.md`
- `_bibliography/papers.bib` — All publications. First ~126 lines are `@string` macros; entries start after. Uses `selected={true}` to feature papers on the homepage.
- `_news/` — News announcements (files named `announcement_N.md`). Homepage shows the 5 most recent (`announcements.limit: 5` in config).
- `_config.yml` — Jekyll + al-folio configuration, scholar settings, social links
- `_data/repositories.yml` — GitHub repos to display (currently empty)
- `assets/img/publication_preview/` — Thumbnail images/gifs for papers
- `assets/pdf/cv.pdf` — CV file linked from the about page

## Key conventions

- BibTeX keys: `<firstauthor><year><shortname>` (e.g., `qu2024HTRL`, `yang2026MALLM`). Keys must be unique — duplicates cause one entry to shadow the other.
- Papers use `arxiv={NNNN.NNNNN}` for arXiv links (just the ID, not the full URL).
- The `journal` field doubles as venue/status display text (e.g., `ICLR`, `AISTATS (oral, top 2%)`, `arXiv preprint`).
- Author's name is bolded automatically via scholar config (`last_name: [Qu]`, `first_name: [Chengrui]`).
- Only pages with `nav: true` in frontmatter appear in the navbar.

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Requires Ruby, Bundler, and ImageMagick (for responsive images).

## Common tasks

- **Add a paper:** Add a BibTeX entry to `_bibliography/papers.bib`. Set `selected={true}` to show on homepage. Add a preview image to `assets/img/publication_preview/`.
- **Add news:** Create `_news/announcement_N.md` with frontmatter `layout: post`, `date: YYYY-MM-DD`, `inline: true`.
- **Update CV:** Replace `assets/pdf/cv.pdf`.

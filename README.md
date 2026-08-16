# crqu.github.io

Personal academic website for Chengrui Qu — built with [Jekyll](https://jekyllrb.com/)
on a heavily customized [al-folio](https://github.com/alshedivat/al-folio) base,
hosted on GitHub Pages.

## Develop

```bash
bundle install
bundle exec jekyll serve      # http://localhost:4000
```

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

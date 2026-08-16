---
layout: page
title: Blog
permalink: /blog/
description: Research notes and technical writing.
nav: true
nav_order: 4
pagination:
  enabled: true
---

{% comment %}
The page title/description come from this file's front matter and are rendered by
`layout: page`. Do not repeat them here.
{% endcomment %}

{% assign tag_count = site.display_tags | size %}
{% assign category_count = site.display_categories | size %}

{% if tag_count > 0 or category_count > 0 %}

  <div class="tag-category-list">
    <ul class="p-0 m-0">
      {% for tag in site.display_tags %}
        <li>
          <i class="fa-solid fa-hashtag fa-sm"></i> <a href="{{ tag | slugify | prepend: '/blog/tag/' | relative_url }}">{{ tag }}</a>
        </li>
      {% endfor %}
      {% if tag_count > 0 and category_count > 0 %}
        <li>&nbsp;&middot;&nbsp;</li>
      {% endif %}
      {% for category in site.display_categories %}
        <li>
          <i class="fa-solid fa-tag fa-sm"></i> <a href="{{ category | slugify | prepend: '/blog/category/' | relative_url }}">{{ category }}</a>
        </li>
      {% endfor %}
    </ul>
  </div>
{% endif %}

{% assign posts = paginator.posts | default: site.posts %}

<ul class="post-list">
  {% for post in posts %}
    <li>
      <h3>
        <a class="post-title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h3>
      <p class="post-meta">{{ post.date | date: '%B %d, %Y' }}</p>
      <p class="post-description">{{ post.description }}</p>
    </li>
  {% endfor %}
</ul>

{% include pagination.liquid %}

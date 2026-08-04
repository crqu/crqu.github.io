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

{% assign blog_name_size = site.blog_name | size %}
{% assign blog_description_size = site.blog_description | size %}

{% if blog_name_size > 0 or blog_description_size > 0 %}
  {% if blog_name_size > 0 %}
    <h1>{{ site.blog_name }}</h1>
  {% endif %}
  {% if blog_description_size > 0 %}
    <p>{{ site.blog_description }}</p>
  {% endif %}
{% endif %}

{% if site.display_tags or site.display_categories %}
  <div class="tag-category-list">
    <ul class="p-0 m-0">
      {% for tag in site.display_tags %}
        <li>
          <i class="fa-solid fa-hashtag fa-sm"></i> <a href="{{ tag | slugify | prepend: '/blog/tag/' | relative_url }}">{{ tag }}</a>
        </li>
      {% endfor %}
      {% if site.display_categories.size > 0 and site.display_tags.size > 0 %}
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

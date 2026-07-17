# Abiding Place Fellowship website

This repository contains the Shelburne fellowship website source and a verified content layer prepared from the church’s legacy official website, Town of Shelburne records and dated local community reporting.

## Design boundary

The existing fonts, colour system, responsive layout and component styling remain the design baseline. The July 2026 content pass focuses on factual accuracy, authentic church media, information architecture and editorial safeguards.

## Content source of truth

- `config/`: public contact and site settings
- `content/site/`: verified structured church content
- `content/media/media-manifest.json`: official legacy media inventory
- `content/research/`: facts, sources and church-confirmation checklist
- `scripts/fetch-official-media.py`: optional rights-approved media migration

## Important editorial rules

1. Do not publish a current event without direct church confirmation.
2. Do not assign leadership titles based only on an old worship schedule or photograph.
3. Do not use named testimonials without written consent and a traceable source.
4. Do not copy local-news photographs or text without publisher permission.
5. Do not migrate photographs of children, seniors or mission participants until consent and rights are confirmed.
6. Bible-study times are consistently published, but current topics conflict across legacy pages.

## Deployment discipline

The Vercel production site was deployed through the CLI. Repository commits should be consolidated and reviewed before one deliberate production deployment. Do not trigger a deployment for each copy or media change.

## CMS note

The existing Decap CMS configuration still uses `git-gateway`. Authentication must be intentionally configured for the final hosting environment before the admin UI is treated as production-ready. The structured files remain editable directly in Git even when the browser CMS is not enabled.

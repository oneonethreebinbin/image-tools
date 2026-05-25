---
title: AI Watermark Remover
emoji: 🖌️
colorFrom: indigo
colorTo: purple
sdk: docker
pinned: false
---

# AI Watermark Remover

LaMa (Large Mask Inpainting) model for intelligent watermark removal.

## API

- `GET /api/health` — health check
- `POST /api/remove-watermark-by-coords` — remove watermark by bounding box coordinates
- `POST /api/remove-watermark` — remove watermark by mask image

## Integration

Pair with the [image-tools](https://image-tools.pages.dev) frontend.

## Docs

Access `/docs` for interactive Swagger API docs.

# Wiki Structure Documentation

This project has wiki-related files in two locations. This document explains why they exist separately and how they relate.

## Locations

### 1. `LLM_Wiki/` (Root level)
- **Purpose**: LLM/AI processing pipeline for content extraction from PDFs
- **Contains**: Extraction scripts, raw PDF content, processed wiki data (concepts, entities, quran references)
- **Why separate**: This is a build-time toolchain, not part of the runtime application. It uses `pdf-parse` and `canvas` which are heavy dependencies unsuitable for the frontend.

### 2. `artifacts/adhkar/wiki/` + `WIKI_SCHEMA.md`
- **Purpose**: Runtime wiki data consumed by the adhkar frontend application
- **Contains**: Pre-processed, structured wiki content optimized for the web app
- **Why separate**: The adhkar app needs a lightweight, pre-built data layer. The `WIKI_SCHEMA.md` documents the schema used by the frontend.

## Data Flow

```
attached_assets/*.pdf
    → LLM_Wiki/scripts/ (extraction)
    → LLM_Wiki/wiki/ (intermediate structured data)
    → artifacts/adhkar/public/data/library_content.json (runtime data)
```

## Decision

These directories serve different purposes (build-time vs runtime) and should remain separate. Merging them would create an unnecessary coupling between the extraction pipeline and the web application.

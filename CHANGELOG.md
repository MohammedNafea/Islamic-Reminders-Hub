# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Automated PDF Extraction Pipeline**: Added a robust pipeline `scripts/knowledge-pipeline.cjs` to extract, sanitize, and classify Islamic texts from large PDF repositories.
- **Enhanced Encyclopedia Schema**: Introduced `language`, `jurisdiction`, `islamicRuling`, and `mediaUrl` fields to `LibraryContentItem`.
- **Validation Script**: Added `scripts/validate-encyclopedia.cjs` to enforce strict schema adherence across JSON datasets.
- **Testing Suite**: Initialized Vitest suite with integration tests for search and library content schemas.
- **Deployment Script**: Added `deploy.sh` for an end-to-end automated build process including PDF extraction and content validation.

### Changed
- Updated `HadithRulings.tsx` to dynamically render new metadata badges for `language`, `jurisdiction`, and `islamicRuling`.
- Expanded the library taxonomy to include `tafsir`, `sira`, `ethics`, and `library` categories.
- Fixed corrupted Arabic character encodings in `src/i18n/locales/ar.ts` specifically related to Ruqyah descriptions.
- Rectified missing keys in English translations (`needs_review`, `cat_library`, `hub_prayer_desc`).

### Fixed
- Addressed `prefer-const` and empty block statement rules in ESLint.
- Resolved permission errors during the Vite build pipeline associated with PWA worker caching on Windows.

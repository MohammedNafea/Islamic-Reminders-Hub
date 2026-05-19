# LLM Wiki Schema - Islamic Reminders Hub

This document defines the conventions and workflows for the Islamic Content LLM Wiki.

## Directory Structure
- `/wiki/index.md`: The content-oriented catalog.
- `/wiki/log.md`: Chronological append-only record of changes.
- `/wiki/sources/`: Summaries and key takeaways from raw documents.
- `/wiki/entities/`: Pages for specific scholars, narrators, and historical figures.
- `/wiki/concepts/`: Fiqh rules, Creed topics, and general religious concepts.
- `/wiki/raw_sources/`: Placeholders/metadata for raw PDF/text sources.

## Naming Conventions
- Use descriptive, lower-case filenames with hyphens (e.g., `concept-salah.md`).
- Use Wikilinks for cross-referencing: `[[concept-salah]]`.

## Workflows

### Ingest Workflow
1. **Read**: Analyze the raw source file.
2. **Summarize**: Create a new file in `/wiki/sources/`.
3. **Extract Entities**: Identify scholars/narrators mentioned. Create/Update pages in `/wiki/entities/`.
4. **Extract Concepts**: Identify Fiqh/Creed/Ethics topics. Create/Update pages in `/wiki/concepts/`.
5. **Cross-Link**: Ensure all new pages are linked to existing ones and referenced in `index.md`.
6. **Log**: Add an entry to `log.md`.

### Query Workflow
1. Search `index.md` for relevant pages.
2. Read the specific wiki pages.
3. Synthesize the answer.
4. (Optional) If the answer contains new synthesis, create a new concept page.

## Content Rules
- **Privacy & Filtering**: Respect any user-defined exclusions (e.g., name filtering if specified).
- **Citations**: Always link back to the source page in `/wiki/sources/`.
- **Conflict Resolution**: If a new source contradicts an old one, note the difference in a "Scholarly Opinions" section within the concept page.

## Maintenance (Lint)
- Regularly check for orphaned pages.
- Ensure all concept pages have at least one link to a source.
- Update `index.md` status (e.g., "Draft", "Complete", "Needs Expansion").

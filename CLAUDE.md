# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TranslateMessages is a Cloudflare Workers application that translates Java Spring Boot `messages.properties` files into multiple languages using Cloudflare's AI service (m2m100-1.2B model).

Components:
- **Cloudflare Worker** (`src/index.ts`): Backend API handling POST requests with file uploads
- **Web Interface** (`pages/`): Cloudflare Pages frontend for browser-based usage
- **Ruby CLI** (`translate_messages.rb`): Command-line tool for batch translations

Demo: https://translatemessages.pages.dev

## Development Commands

```bash
npm run dev      # Start local development server
npm test         # Run tests (Vitest with Cloudflare Workers pool)
npm run deploy   # Deploy Worker to Cloudflare
npm run cf-typegen  # Generate TypeScript types from wrangler.toml
```

## Translation Pipeline Architecture

The Worker processes `.properties` files through several stages in `src/index.ts`:

1. **Entry Building** (`buildEntries`): Groups lines into logical entries, handling multi-line continuations (lines ending with odd number of backslashes)

2. **Parsing**: Each entry is parsed into segments with `prefix`, `value`, and `suffix`:
   - `parseFirstLine`: Finds key-value separator (`=`, `:`, or whitespace)
   - `parseContinuationLine`: Handles continuation lines preserving leading whitespace
   - `extractValueAndSuffix`: Separates value from trailing whitespace, continuations, and inline comments

3. **Pre-translation Processing**:
   - `unescapePropertiesText`: Converts escape sequences (`\n`, `\t`, `\uXXXX`, etc.) to actual characters
   - `maskPlaceholders`: Replaces `{0}`, `${name}`, `%s` style placeholders with markers (`__PH_N__`) to protect them from translation

4. **Translation**: Segments are joined with a special delimiter (`\u241E`) and sent to the AI model in batches of 100 concurrent requests

5. **Post-translation Processing**:
   - `restorePlaceholders`: Puts original placeholders back
   - `escapePropertiesText`: Re-escapes special characters for `.properties` format
   - Line structure (prefixes, suffixes, newline style) is preserved

## Testing

Tests in `test/index.spec.ts` use mocked AI responses. The test environment uses `@cloudflare/vitest-pool-workers` configured in `vitest.config.mts`.

Run a specific test:
```bash
npm test -- -t "test name pattern"
```

## Deployment

- **Worker**: `npm run deploy` (requires `wrangler login` first)
- **Pages**: `wrangler pages publish pages --project-name <name>` (update form action URL in `pages/index.html` first)

## Supported Languages

Uses m2m100 model - see https://huggingface.co/facebook/m2m100_1.2B#languages-covered. Dialects (e.g., pt-BR vs pt-PT) are not supported; language codes are normalized by taking the part before any hyphen.
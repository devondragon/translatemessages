# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TranslateMessages is a Cloudflare Workers application that translates Java Spring Boot `messages.properties` files into multiple languages using Cloudflare's AI service (Facebook's m2m100_1.2B model). It consists of three main components:

1. **Cloudflare Worker** (`src/index.ts`): Backend API handling file uploads and translations
2. **Web Interface** (`public/`): Cloudflare Pages frontend for browser-based usage
3. **Ruby CLI** (`translate_messages.rb`): Command-line tool for batch translations

## Development Commands

```bash
# Start local development server
npm run dev

# Run tests
npm test

# Deploy to Cloudflare
npm run deploy

# Generate TypeScript types from wrangler.toml
npm run cf-typegen
```

## Architecture

The application follows a serverless architecture:

- **Entry Point**: `src/index.ts` - Main Worker handling POST requests to `/translate`
- **Frontend**: Static files in `public/` served via Cloudflare Pages
- **Configuration**: `wrangler.toml` defines the Worker with AI binding
- **Testing**: Tests in `test/` directory using Vitest with Cloudflare Workers pool

Key architectural decisions:
- Uses Cloudflare AI binding for translation (no external API calls)
- Streams file uploads to handle large files efficiently
- Returns translated content as downloadable files with appropriate naming
- Supports multiple target languages in a single request

## Testing

Tests use Vitest with `@cloudflare/vitest-pool-workers` for Worker-specific testing:

```bash
# Run all tests
npm test

# Test files are located in test/ directory
```

## Deployment

The project deploys to two Cloudflare services:

1. **Worker**: Deployed via `npm run deploy` (API endpoint)
2. **Pages**: Frontend deployed separately (see README.md for manual steps)

Demo site: https://translatemessages.pages.dev

## Key Files and Their Purposes

- `src/index.ts`: Main Worker logic handling translation requests
- `wrangler.toml`: Cloudflare Worker configuration with AI binding
- `translate_messages.rb`: Ruby CLI for batch translation operations
- `public/index.html`: Web interface for browser-based uploads
- `public/script.js`: Frontend JavaScript handling file uploads and UI

## Working with Cloudflare AI

The Worker uses Cloudflare's AI binding configured in `wrangler.toml`:

```toml
[ai]
binding = "AI"
```

Translation model: `@cf/m2m100/m2m100-1.2b` supporting multiple language pairs.
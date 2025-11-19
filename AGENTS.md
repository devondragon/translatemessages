# Repository Guidelines

## Project Structure & Module Organization
Cloudflare Worker code lives in `src/index.ts`, which exports the single `fetch` handler plus helper translators. Shared worker typings are declared in `worker-configuration.d.ts`, while deployment knobs sit in `wrangler.toml`. Browser tooling for manual translations is under `pages/` (deployable via Cloudflare Pages after updating the `<form action>`), and the Ruby automation lives in `cli/translate_messages.rb`. Tests reside in `test/`, and `local.html` exercises the worker when running locally.

## Build, Test, and Development Commands
- `npm run dev` / `npm start` — boot Wrangler’s local worker preview with auto-reload.
- `npm test` — execute Vitest specs with the Cloudflare Workers pool; keep suites deterministic because mocks share the same event loop.
- `npm run deploy` — publish the worker defined in `wrangler.toml`.
- `npm run cf-typegen` — refresh generated bindings after you edit durable objects, KV, or AI bindings.
- `ruby cli/translate_messages.rb -f messages.properties -l fr,es` — exercise the worker end-to-end from the CLI.

## Coding Style & Naming Conventions
Write worker logic in TypeScript targeting ES2021 modules (see `tsconfig.json`). Prefer async/await and small helpers for parsing or validation; avoid monolithic handlers. Keep indentation to tabs in TypeScript and two spaces in Ruby. Use lower_snake_case for `.properties` keys, camelCase for TypeScript variables, and ALL_CAPS for env bindings like `Env.AI`. Validate inputs at the boundary and centralize shared constants (e.g., supported language lists) in `src/index.ts`.

## Testing Guidelines
Vitest + `@cloudflare/vitest-pool-workers` is configured in `vitest.config.mts`. Add new specs under `test/*.spec.ts`, naming suites after the worker feature (`describe('translateMessages', ...)`). Mock AI calls with `vi.fn()` to keep tests fast. Run `npm test` before every PR and add regression coverage whenever worker behavior or error handling changes.

## Commit & Pull Request Guidelines
Follow the short, imperative subject style used in history (`Bump vite to 6.4.1`, `Add worker validation`). Reference related issues or PRs in the body using `Refs #123` when applicable. PRs should outline motivation, key changes, and testing evidence; include CLI output or screenshots if UI paths (`pages/`) changed. Ensure lint/tests pass in CI before requesting review.

## Configuration & Deployment Tips
The worker depends on an `AI` binding; keep Wrangler environments in sync when rotating accounts. Use `local.html` against `npm run dev` to verify cross-origin uploads. If you ship the optional Pages frontend, point the form at the deployed worker route and document the target languages supported by `SUPPORTED_LANGUAGES` so users select valid codes.

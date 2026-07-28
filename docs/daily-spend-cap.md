# Task: cap daily Workers AI spend

Hand-off spec. Self-contained — you should not need the conversation that produced it.

## Why this exists

`translatemessages` is a public, unauthenticated Worker that spends Workers AI budget
on every request. Per-IP burst limiting shipped in PR #50, but it cannot bound a
day's spend, so nothing does.

## What already exists (do not rebuild it)

Per-IP burst limiting via Cloudflare's rate limiting binding:

- `isRateLimited()` — `src/index.ts:199`
- `clientKey()` — `src/index.ts:191`, buckets on `CF-Connecting-IP`
- called from the `fetch` handler at `src/index.ts:228`, deliberately **after** the
  `OPTIONS` preflight branch
- bindings in `wrangler.toml`: production 20/60s, staging 60/60s on a separate
  namespace, personal instance intentionally unbound
- a missing binding means "do not limit"; a limiter that throws fails open and logs

**Why it does not solve this problem**, both measured against the live edge:

- The binding's window accepts only 10 or 60 seconds. 20/minute sustained is roughly
  28,000 requests/day, against a free allocation of about 17 full-file translations.
- Counters are per Cloudflare location and the API is documented as "permissive,
  eventually consistent". A 40-request burst against production's 20/60s limit let
  **38** through. Treat the configured number as a soft target, not a ceiling.

## Goal

Refuse translation requests once the deployment has spent its daily budget, and say
so clearly. Burst limiting stays exactly as it is; this sits alongside it.

## Requirements

1. **A real daily ceiling.** Once the day's budget is used, requests are refused
   until the window rolls over. Cloudflare's Neuron allocation resets at 00:00 UTC —
   match that so the two do not drift.
2. **Count work, not requests.** A 5MB file with 3,000 entries costs far more than a
   3-line file. Counting requests would let one large upload exhaust the day while
   reporting a single unit. Count entries actually sent to the model, or estimated
   tokens. `translateMessages` already computes `attemptedEntries`
   (`src/index.ts:350`, returned in `TranslationResult` at `src/index.ts:343`), which
   is the natural unit and already excludes comments and blank lines.
3. **Charge after the fact, check before.** The cost of a request is not known until
   it has run. Check the counter before translating and increment after, accepting
   that the last request of the day can overshoot. Do not try to pre-authorise;
   nothing here justifies that complexity.
4. **Configurable per deployment,** in the same style as `DEFAULT_MODEL` and
   `ALLOWED_MODELS`. The personal instance must be able to opt out entirely, exactly
   as it does for rate limiting today.
5. **Fail open on storage errors.** Consistent with `isRateLimited`: a broken counter
   must not take translation down. Log and continue.
6. **A distinguishable response.** `429` with `Retry-After` is defensible, but the
   body must make clear this is a daily cap rather than the per-minute limiter, or
   the frontend's "wait a minute and try again" message becomes a lie. Consider
   `503` with a `Retry-After` pointing at the next UTC midnight.
7. **CORS headers on the refusal.** The `fetch` wrapper applies them to responses
   returned from `handleTranslation`, but the rate-limit branch builds its own
   response and spreads `...cors` explicitly. Follow whichever path you take —
   without the header the browser discards the body and the user sees a generic
   network error.

## Design options

| Option | Fits | Against |
|---|---|---|
| **KV** | Simplest; a counter per UTC date key. Free tier is generous. | Eventually consistent, ~60s propagation. Concurrent increments lose writes, so the count undercounts under load — the exact condition you care about. |
| **Durable Object** | Strongly consistent; a single object serialises increments and gives an exact count. Alarms can reset it. | An extra binding and class; every request pays a hop to one location. |
| **D1** | Consistent, SQL, easy to inspect and chart. | Heavier than a counter needs; write throughput is the limiting factor. |

**Recommended: a single Durable Object** holding one integer plus the UTC date it
belongs to. Reset when the date rolls over rather than using an alarm — simpler, and
correct even if the Worker is idle across midnight. The whole point is an accurate
ceiling, and KV's lost-update behaviour undermines exactly that. One DO for the whole
Worker is fine: this endpoint is not high-throughput, and if it ever were, that is
itself the signal the cap should be enforcing.

Push back if you disagree after reading the code — this is a recommendation, not a
constraint.

## Integration points

- `Env` (`src/index.ts:1`) — add the binding and the budget var, following the
  existing `RATE_LIMITER?: RateLimit` pattern of an optional binding meaning "off".
- `fetch` (`src/index.ts:228`) — the check belongs after the burst-limit branch and
  before `handleTranslation`. Preflight must stay exempt for the same reason it is
  exempt from burst limiting: a limited `OPTIONS` surfaces as a CORS failure, not as
  the status you meant to send.
- `handleTranslation` (`src/index.ts:267`) — the increment belongs here, after
  `translateMessages` returns, where `attemptedEntries` is in scope. Do not charge
  for a request that failed validation (bad language, oversized file) — those spend
  nothing.
- `wrangler.toml` — production and staging get a budget; `[env.personal]` gets none
  and must keep working. There is a comment there explaining the same choice for rate
  limiting; match its reasoning.

## Repo conventions

Follow these; CI enforces the first four.

```bash
npx tsc --noEmit                          # source types
npx tsc -p test/tsconfig.json --noEmit    # test types, a separate step and easy to miss
npm test                                  # vitest, 129 tests today
npx wrangler deploy --env staging --dry-run
```

- Branch, PR, and **wait for `gh pr checks <n>` to pass before merging**. Merging
  without gating on CI has broken `main` in this repo before.
- Comments explain *why*, not *what*. See `PLACEHOLDER_MARKER_PREFIX` and
  `SEGMENT_DELIMITER` in `src/index.ts` for the register — they record the failure
  that motivated the code.
- Guards are mutation-tested here: neuter the new check and confirm the new tests
  fail, so they are pinning behaviour rather than passing incidentally. This caught a
  weak assertion in the rate limiting PR, where a test would have passed with the
  limiter bypassed entirely.
- Note that `cp` is aliased to `cp -i` and `noclobber` is set in this shell; use
  `command cp -f` when restoring a backup, or the restore silently does not happen.

## Test plan

- under budget → request proceeds
- over budget → refused, and **no AI call is made** (assert the mock was not called;
  the entire point is not spending)
- refusal carries CORS headers, the correct status, and a `Retry-After`
- the counter increments by `attemptedEntries`, not by 1
- a request rejected for validation does not increment
- counter resets when the UTC date changes (inject the date; do not sleep)
- storage error → fails open, request proceeds, error logged
- no binding → no capping at all, so the personal instance is unaffected
- preflight is never capped

## Verification

1. Staging first. Set a deliberately tiny budget (say 5 entries), send a file with
   more entries than that, confirm the next request is refused and that the response
   body distinguishes the daily cap from the per-minute limiter.
2. Raise the budget to something realistic, confirm normal traffic is unaffected.
3. Production is a **manual** deploy: `gh workflow run ci.yml --ref main`. Wait for
   it, then re-verify — deploys roll out gradually and mixed versions have been
   observed serving concurrently for a minute or two. Do not trust a single probe.

## Open decisions for the repo owner

Ask rather than assume:

- **What is the daily budget?** The free allocation is 10,000 Neurons/day ≈ $0.011 ×
  10 = $0.11 of usage. On the current default (`llama-3.1-8b`, batched) a 373-entry
  file costs about $0.0044, so the free tier is roughly 25 files/day. A budget
  expressed in entries is easier to reason about than one in Neurons.
- **Refuse or degrade?** Falling back to the cheapest model when over budget keeps
  the demo alive at reduced quality. That may be better for a public demo than a hard
  refusal — but it is a product decision, not a technical one.
- **Per-IP or global?** A global cap is simple but lets one abuser deny everyone else
  for the rest of the day. A per-IP daily cap resists that, at the cost of more keys
  and no protection against a distributed source.

## Background

`docs/model-comparison/` records the model evaluation, measured costs, and why
`llama-3.1-8b` is the default — including the per-file cost figures this budget
should be sized against.

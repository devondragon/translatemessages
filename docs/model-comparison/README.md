# Model comparison: m2m100 vs instruction-following models

Baseline measurements taken 2026-07-27 against the deployed staging Worker, using
`scripts/compare-models.mjs` and `scripts/fixtures/comparison.properties` (25 entries).

Regenerate with:

```bash
node scripts/compare-models.mjs --models m2m100,llama-3.1-8b,llama-4-scout --languages fr,ja
```

## Conclusion

**Instruction-following models are clearly better on high-resource languages and
should not be adopted for the full supported-language list without further work.**

Acted on: `llama-3.1-8b` is now the default. It beats m2m100 on wording quality and
is the only candidate that also costs less once batched. `llama-4-scout` is better
still on quality and roughly 3x faster, at about 3.3x the token cost, which suits a
private instance with one user rather than a public endpoint with no rate limiting --
see `[env.personal]` in `wrangler.toml`.

The two defect classes found in the low-resource sweep are now guarded: invented
placeholders and leaked model commentary both fail the entry rather than reaching
the file.

## High-resource languages (fr, es, de, ja)

[Full report](./high-resource-2026-07-27.md)

Placeholders lost: **0 across all 600 translations**, every model. Structural
integrity is no longer what separates them; wording quality is.

| Model | Translated (of 100) | Failures | Latency |
|---|---|---|---|
| m2m100 (current default) | 95 | 1 | 2.2–6.6s |
| llama-3.1-8b | 100 | 0 | ~2.3s |
| llama-3.2-3b | 89 | 9 | 0.7–0.9s |
| llama-3.3-70b | 97 | 0 | 1.6–4.1s |
| llama-4-scout | 98 | 0 | ~1.2s |
| mistral-small-3.1 | 99 | 0 | 1.9–3.2s |

m2m100 is weakest exactly where a `messages.properties` file lives — short UI
strings:

- `Save` → `Sauvons` (fr, "let us save") and `Rettung` (de, "rescue"), where the
  instruct models give `Enregistrer` / `Speichern`.
- `Task Manager` and `Hi {0}` left untranslated in German.
- `First line\nSecond line` → `Erste Linie\nZZ Zweite Linie` (de): "Linie" is a
  geometric line rather than a line of text, and `ZZ` is marker debris that survived
  verification because the marker itself was intact.

## Low-resource languages (ff, ilo, ns, wo, ast, am)

[Full report](./low-resource-2026-07-27.md)

The headline numbers favour the instruct models — llama-4-scout scored 144/150
"translated" against m2m100's 101/150 — **but that column is misleading here and
should not be read as a quality result.** It only measures whether the output
differs from the English source, which confidently wrong output also satisfies.

Spot-checking found both approaches unusable:

- m2m100, Fulah `Welcome to your dashboard` → `Mo Di Mi Do Fr Sa So` (German weekday
  abbreviations). Wolof → `Lees meer »` (Dutch).
- llama-4-scout, Fulah `Hello {0}` → `Bonjour {0}` and Wolof `Save` → `Sauvegarder`.
  Both French.

m2m100 frequently echoes the English instead, which is at least visibly untranslated.
The instruct models fail silently, which is worse for a file destined for production.

### Two defects this surfaced

Neither is currently guarded against. Both affect the instruct path only, which is
opt-in and not reachable from the frontend.

1. **Hallucinated placeholders.** `app.welcome` has no placeholder in the source, and
   llama-4-scout returned `Welcoming ngal laawol ɗuniyaarum {0}`. Verification checks
   that every source placeholder survives; nothing rejects placeholders the model
   invented. A literal `{0}` in a Spring message is a production bug.

2. **Leaked commentary.** llama-3.1-8b returned
   `Saw\n\n(No change, as "Save" is a single word)` as the value.
   `cleanInstructOutput` strips leading labels and wrapping quotes, but not a
   parenthetical note appended after a blank line.

## If this is adopted

1. Reject outputs containing placeholders absent from the source.
2. Reject multi-line or parenthetical commentary in a single-line value.
3. Restrict the instruct path to languages where it has been measured, and keep
   m2m100 — or refuse the request — elsewhere.
4. Batch multiple entries per call. This is where the cost advantage is, and only an
   instruction-following model can do it; m2m100 is one call per entry by
   construction. Prototyped unbatched on purpose, so the model was the only variable.

## Cost

From <https://developers.cloudflare.com/workers-ai/platform/pricing/>, read
2026-07-27. Workers AI bills $0.011 per 1,000 Neurons with 10,000 Neurons free per
day. Per million tokens:

| Model | Input | Output |
|---|---|---|
| m2m100-1.2b | $0.342 | $0.342 |
| llama-3.2-3b-instruct | $0.051 | $0.335 |
| llama-3.1-8b-instruct-fp8 | $0.152 | $0.287 |
| llama-4-scout-17b-16e-instruct | $0.270 | $0.850 |
| mistral-small-3.1-24b-instruct | $0.351 | $0.555 |
| llama-3.3-70b-instruct-fp8-fast | $0.293 | $2.253 |

Applied to the 373-entry file used above (~8.9k input / ~10.2k output tokens, a
Latin-script target, ~105-token system prompt for the instruct models), the cost of
translating the whole file once:

| Model | 1 entry/call | 50 entries/call | vs m2m100 |
|---|---|---|---|
| m2m100 | $0.0065 | n/a — cannot batch | 1.00x |
| llama-3.2-3b | $0.0059 | $0.0039 | 0.90x / 0.60x |
| llama-3.1-8b | $0.0102 | $0.0044 | 1.57x / **0.68x** |
| llama-4-scout | $0.0216 | $0.0113 | 3.32x / 1.73x |
| mistral-small-3.1 | $0.0225 | $0.0091 | 3.45x / 1.39x |
| llama-3.3-70b | $0.0370 | $0.0258 | 5.68x / 3.96x |

Two things follow.

**Only llama-3.1-8b is cheaper than m2m100, and only when batched.** An earlier note
in this repo claimed instruct models would generally undercut m2m100 once batched;
that was extrapolated from `llama-3-8b-instruct-awq`, which was deprecated on
2026-05-30 mid-experiment. It holds for llama-3.1-8b and not for llama-4-scout.

**Batching is implemented** (20 entries per call, instruct models only), so the
batched column is what production actually pays. Measured on the 373-entry file
against staging, both at zero reported failures:

| Model | Wall clock, whole file | Notes |
|---|---|---|
| llama-3.1-8b (default) | ~50s | ~0.70x m2m100 cost |
| llama-4-scout (personal) | ~21s | ~1.73x m2m100 cost |

Batching did not improve wall clock for llama-3.1-8b -- each call returns twenty
translations, so the calls take proportionally longer -- but it cuts the number of
calls from 373 to about 19, which is where the saving is. If latency matters more
than cost, llama-4-scout is roughly 2.5x faster.

**The absolute numbers are trivial and the free tier is the real constraint.** Two
cents translates an entire application's messages file. But 10,000 Neurons/day is
about $0.11 of usage, which is roughly 17 full-file translations per day on m2m100
against 5 on llama-4-scout — worth weighing for a public demo, where request volume
rather than unit price decides the bill.

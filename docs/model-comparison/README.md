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
Two defect classes found in the low-resource sweep are not yet guarded against.

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

Not settled. `llama-3-8b-instruct-awq`, the original candidate, was deprecated on
2026-05-30 and now returns error 5028 — the generated `worker-configuration.d.ts`
still lists it, so the types gave no warning. Cloudflare's docs do not publish unit
pricing for the exact IDs that work today (`llama-3.1-8b-instruct-fp8`,
`llama-4-scout-17b-16e-instruct`, `mistral-small-3.1-24b-instruct`), so read those
off the dashboard rather than extrapolating from the non-fp8 variants.

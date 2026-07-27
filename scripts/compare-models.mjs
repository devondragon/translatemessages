#!/usr/bin/env node
// Runs one .properties fixture through both translation backends and reports how
// they differ. Written because the choice between m2m100 and an instruction-following
// model is a quality question, and quality questions are not settled by reading
// pricing tables.
//
//   node scripts/compare-models.mjs                        # staging, default languages
//   node scripts/compare-models.mjs --languages fr,ja      # pick languages
//   node scripts/compare-models.mjs --url http://localhost:8787 --out report.md
//
// What it measures objectively:
//   - placeholder fidelity: every placeholder in the source present in the output
//   - untranslated rate: values that came back byte-identical to the English
//   - structural integrity: same keys, same entry count, escapes preserved
//   - reported failures (X-Translation-Failures) and wall-clock latency
//
// What it deliberately does not measure: whether the translation is any *good*.
// No automatic metric substitutes for reading the side-by-side output, which is why
// the report includes it in full.

import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const DEFAULT_URL = "https://translatemessages-staging.justblackmagic.workers.dev/";
const DEFAULT_FIXTURE = new URL("./fixtures/comparison.properties", import.meta.url).pathname;
const DEFAULT_LANGUAGES = ["fr", "es", "de", "ja"];
const MODELS = ["m2m100", "llama"];

// Kept in step with PLACEHOLDER_REGEX in src/index.ts. If they drift, this script
// will happily report a fidelity score that the Worker does not actually enforce.
const PLACEHOLDER_REGEX = /\{[0-9a-zA-Z_,.#:\s]+\}|\$\{[0-9a-zA-Z_.:-]+\}|%[0-9]*\$?[-+#0-9.]*[a-zA-Z]/g;

function parseArgs(argv) {
	const args = { url: DEFAULT_URL, file: DEFAULT_FIXTURE, languages: DEFAULT_LANGUAGES, out: null };
	for (let i = 0; i < argv.length; i += 2) {
		const key = argv[i]?.replace(/^--/, "");
		const value = argv[i + 1];
		if (!key || value === undefined) continue;
		if (key === "languages") args.languages = value.split(",").map(entry => entry.trim()).filter(Boolean);
		else if (key in args) args[key] = value;
	}
	return args;
}

// Minimal .properties reader: enough to line entries up between two runs. Mirrors the
// Worker's notion of an entry (continuations belong to the line that opened them) so
// the comparison counts the same things the Worker does.
function parseEntries(text) {
	const lines = text.replace(/\r\n?/g, "\n").split("\n");
	const entries = [];

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();
		if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) continue;

		let raw = lines[i];
		while (hasContinuation(lines[i]) && i + 1 < lines.length) {
			i++;
			raw += `\n${lines[i]}`;
		}

		const joined = raw.replace(/\\\n\s*/g, "");
		const separator = joined.search(/[=:]/);
		if (separator === -1) continue;
		entries.push({
			key: joined.slice(0, separator).trim(),
			value: joined.slice(separator + 1).trim()
		});
	}

	return entries;
}

function hasContinuation(line) {
	const trailing = line.match(/\\*$/)?.[0].length ?? 0;
	return trailing % 2 === 1;
}

function placeholdersIn(value) {
	return value.match(PLACEHOLDER_REGEX) ?? [];
}

async function translate({ url, content, language, model }) {
	const form = new FormData();
	form.append("file", new Blob([content], { type: "text/plain" }), "messages.properties");
	form.append("language", language);
	form.append("model", model);

	const startedAt = Date.now();
	const response = await fetch(url, { method: "POST", body: form });
	const elapsedMs = Date.now() - startedAt;
	const body = await response.text();

	if (!response.ok) {
		return { ok: false, status: response.status, body, elapsedMs };
	}

	return {
		ok: true,
		status: response.status,
		body,
		elapsedMs,
		reportedFailures: Number(response.headers.get("X-Translation-Failures") ?? 0)
	};
}

function score(sourceEntries, result) {
	if (!result.ok) {
		return { failed: true, status: result.status, body: result.body.slice(0, 200), elapsedMs: result.elapsedMs };
	}

	const translated = new Map(parseEntries(result.body).map(entry => [entry.key, entry.value]));
	const rows = [];
	let placeholderViolations = 0;
	let unchanged = 0;
	let missingKeys = 0;

	for (const source of sourceEntries) {
		const output = translated.get(source.key);
		if (output === undefined) {
			missingKeys++;
			rows.push({ ...source, output: null, lostPlaceholders: [], unchanged: false });
			continue;
		}

		// Counted, not just present: a value using {0} twice must come back with both.
		const lostPlaceholders = [];
		for (const placeholder of new Set(placeholdersIn(source.value))) {
			const needed = placeholdersIn(source.value).filter(entry => entry === placeholder).length;
			const found = output.split(placeholder).length - 1;
			if (found < needed) lostPlaceholders.push(placeholder);
		}
		if (lostPlaceholders.length > 0) placeholderViolations++;

		const isUnchanged = output === source.value;
		if (isUnchanged) unchanged++;

		rows.push({ ...source, output, lostPlaceholders, unchanged: isUnchanged });
	}

	return {
		failed: false,
		rows,
		total: sourceEntries.length,
		placeholderViolations,
		unchanged,
		missingKeys,
		reportedFailures: result.reportedFailures,
		elapsedMs: result.elapsedMs
	};
}

function renderReport({ fixture, url, languages, results }) {
	const lines = [];
	lines.push(`# Model comparison: m2m100 vs llama`, "");
	lines.push(`Fixture: \`${basename(fixture)}\` · Endpoint: \`${url}\``, "");

	lines.push(`## Summary`, "");
	lines.push(`Lower is better for every column except "translated".`, "");
	lines.push(`| Language | Model | Translated | Unchanged | Placeholders lost | Reported failures | Missing keys | Latency |`);
	lines.push(`|---|---|---|---|---|---|---|---|`);

	for (const language of languages) {
		for (const model of MODELS) {
			const result = results[language][model];
			if (result.failed) {
				lines.push(`| ${language} | ${model} | — | — | — | — | — | HTTP ${result.status} |`);
				continue;
			}
			const translated = result.total - result.unchanged - result.missingKeys;
			lines.push(
				`| ${language} | ${model} | ${translated}/${result.total} | ${result.unchanged} | ` +
				`${result.placeholderViolations} | ${result.reportedFailures} | ${result.missingKeys} | ${result.elapsedMs}ms |`
			);
		}
	}

	lines.push("", `## Side by side`, "");
	lines.push(`Read this part. The table above cannot tell you whether a translation is good,`);
	lines.push(`only whether it is structurally intact.`, "");

	for (const language of languages) {
		const m2m = results[language].m2m100;
		const llama = results[language].llama;
		lines.push(`### ${language}`, "");
		if (m2m.failed || llama.failed) {
			lines.push(`One or both backends failed for this language; see the summary.`, "");
			continue;
		}

		for (let i = 0; i < m2m.rows.length; i++) {
			const source = m2m.rows[i];
			const llamaRow = llama.rows[i];
			lines.push(`**\`${source.key}\`**`, "");
			lines.push("```");
			lines.push(`en     ${source.value}`);
			lines.push(`m2m    ${formatCell(source)}`);
			lines.push(`llama  ${formatCell(llamaRow)}`);
			lines.push("```", "");
		}
	}

	return lines.join("\n");
}

function formatCell(row) {
	if (row.output === null) return "<key missing from output>";
	const notes = [];
	if (row.lostPlaceholders.length > 0) notes.push(`LOST ${row.lostPlaceholders.join(" ")}`);
	if (row.unchanged) notes.push("UNCHANGED");
	return notes.length > 0 ? `${row.output}   <-- ${notes.join(", ")}` : row.output;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const content = await readFile(args.file, "utf8");
	const sourceEntries = parseEntries(content);

	console.error(`Comparing ${MODELS.join(" vs ")} on ${sourceEntries.length} entries across ${args.languages.join(", ")}`);
	console.error(`Endpoint: ${args.url}`);

	const results = {};
	for (const language of args.languages) {
		results[language] = {};
		// Sequential on purpose: concurrent runs would make the latency column noise.
		for (const model of MODELS) {
			process.stderr.write(`  ${language}/${model} ... `);
			const result = await translate({ url: args.url, content, language, model });
			results[language][model] = score(sourceEntries, result);
			console.error(result.ok ? `${result.elapsedMs}ms` : `HTTP ${result.status}`);
		}
	}

	const report = renderReport({ fixture: args.file, url: args.url, languages: args.languages, results });
	if (args.out) {
		await writeFile(args.out, report, "utf8");
		console.error(`\nWrote ${args.out}`);
	} else {
		console.log(report);
	}
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});

export interface Env {
	AI: Pick<Ai, 'run'>;
	// Comma-separated list of browser origins allowed to read responses.
	// Set in wrangler.toml under [vars]; falls back to DEFAULT_ALLOWED_ORIGINS.
	ALLOWED_ORIGINS?: string;
	// Translation model used when the request does not name one.
	// Falls back to FALLBACK_MODEL if unset or unrecognised.
	DEFAULT_MODEL?: string;
	// Comma-separated models a client may request by name. Unset means only
	// DEFAULT_MODEL, which keeps a public endpoint off the expensive ones.
	ALLOWED_MODELS?: string;
}

export interface Segment {
	prefix: string;
	value: string;
	suffix: string;
}

export interface PlaceholderToken {
	marker: string;
	original: string;
}

export interface MaskedSegment {
	text: string;
	tokens: PlaceholderToken[];
	// Placeholders deliberately left in the text for an instruction-following model to
	// copy verbatim, rather than masked behind a marker. Verified after translation
	// exactly as markers are, so both backends fail the same way when a placeholder
	// does not survive.
	literalPlaceholders: string[];
}

// Supported language codes for m2m100 model
const SUPPORTED_LANGUAGES = [
	"af", "am", "ar", "ast", "az", "ba", "be", "bg", "bn", "br", "bs", "ca", "ceb", "cs", "cy", "da", 
	"de", "el", "en", "es", "et", "fa", "ff", "fi", "fr", "fy", "ga", "gd", "gl", "gu", "ha", "he", 
	"hi", "hr", "ht", "hu", "hy", "id", "ig", "ilo", "is", "it", "ja", "jv", "ka", "kk", "km", "kn", 
	"ko", "lb", "lg", "ln", "lo", "lt", "lv", "mg", "mk", "ml", "mn", "mr", "ms", "my", "ne", "nl", 
	"no", "ns", "oc", "or", "pa", "pl", "ps", "pt", "ro", "ru", "sd", "si", "sk", "sl", "so", "sq", 
	"sr", "ss", "su", "sv", "sw", "ta", "th", "tl", "tn", "tr", "uk", "ur", "uz", "vi", "wo", "xh", 
	"yi", "yo", "zh", "zu"
];

// Delimiter used to separate segments in multi-line properties.
// Must be plain ASCII: the translation model silently drops non-ASCII characters
// (U+241E was dropped every time), which broke segment splitting and caused
// correctly translated multi-line entries to be discarded as failures.
const SEGMENT_DELIMITER = "__SEG__";

// Prefix for the markers that stand in for placeholders during translation.
// Shares the plain-ASCII requirement described above for SEGMENT_DELIMITER, and
// must additionally avoid underscores: the previous __PH_n__ form came back from
// the model as PH_0, _PH_0__ or PH_0__ roughly half the time, and a mangled marker
// no longer matches on the way back, so the placeholder it stood for was silently
// dropped from the output file. A bare alphanumeric token survives instead --
// XQZ<n> round-tripped intact in fr/es/de/ja/zh, next to punctuation, inside
// parentheses, and across double-digit indexes.
const PLACEHOLDER_MARKER_PREFIX = "XQZ";

// Translation backends. m2m100 is the default and the only one the frontend uses;
// the rest are opt-in via the `model` form field so their output can be compared
// against m2m100 on identical input. See PLACEHOLDER_MARKER_PREFIX for why masking
// is fragile against a model that rewrites rare tokens -- avoiding it is the point.
//
// A registry rather than a single alternative, because Workers AI retires models on
// its own schedule -- llama-3-8b-instruct-awq was deprecated out from under this
// experiment mid-flight, and the generated types still list it. Candidates are named
// independently of their model IDs so a retirement is a one-line swap.
//
// "seq2seq" models translate text directly and need placeholders masked behind
// markers. "instruct" models are told to copy placeholders verbatim, which is the
// hypothesis this registry exists to test.
const TRANSLATION_MODELS = {
	"m2m100": { id: "@cf/meta/m2m100-1.2b", kind: "seq2seq" },
	"llama-3.1-8b": { id: "@cf/meta/llama-3.1-8b-instruct-fp8", kind: "instruct" },
	"llama-3.2-3b": { id: "@cf/meta/llama-3.2-3b-instruct", kind: "instruct" },
	"llama-3.3-70b": { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", kind: "instruct" },
	"llama-4-scout": { id: "@cf/meta/llama-4-scout-17b-16e-instruct", kind: "instruct" },
	"gemma-3-12b": { id: "@cf/google/gemma-3-12b-it", kind: "instruct" },
	"mistral-small-3.1": { id: "@cf/mistralai/mistral-small-3.1-24b-instruct", kind: "instruct" }
} as const;

export type ModelChoice = keyof typeof TRANSLATION_MODELS;
export const MODEL_CHOICES = Object.keys(TRANSLATION_MODELS) as ModelChoice[];

// Used when DEFAULT_MODEL is unset or names a model that no longer exists, so a
// mistyped var degrades to a working deployment rather than a broken one.
// llama-3.1-8b measurably beats m2m100 on wording quality and is the only candidate
// that also costs less, once batched -- see docs/model-comparison/.
const FALLBACK_MODEL: ModelChoice = "llama-3.1-8b";

function isModelChoice(value: string): value is ModelChoice {
	return (MODEL_CHOICES as string[]).includes(value);
}

function defaultModel(env: Env): ModelChoice {
	return env.DEFAULT_MODEL && isModelChoice(env.DEFAULT_MODEL) ? env.DEFAULT_MODEL : FALLBACK_MODEL;
}

// Which models a client may ask for by name. Unset means only this deployment's
// default, so a public unauthenticated endpoint cannot be steered onto an expensive
// model -- llama-3.3-70b costs roughly 5.7x the default per token, and nothing else
// here rate-limits anyone. Deployments that want the full registry, such as the
// staging instance the comparison harness drives, opt in explicitly.
function selectableModels(env: Env): ModelChoice[] {
	if (!env.ALLOWED_MODELS) {
		return [defaultModel(env)];
	}
	const configured = env.ALLOWED_MODELS.split(",").map(entry => entry.trim()).filter(isModelChoice);
	return configured.length > 0 ? configured : [defaultModel(env)];
}

function usesInstructPrompting(model: ModelChoice): boolean {
	return TRANSLATION_MODELS[model].kind === "instruct";
}

// m2m100 degenerates on very short inputs: "Hi XQZ0" comes back with the marker
// dropped entirely, while "Hi XQZ0." translates correctly and keeps it. Measured
// against the deployed Worker, a trailing period rescued every short-input failure
// in fr and pt, and "Hi {0}" failed identically to "Hi ${name}" -- so this is an
// input-length pathology, not anything to do with placeholder syntax.
const RETRY_TERMINATOR = ".";

// Only period-like characters are stripped back off, because a period is what we
// appended; an exclamation or question mark in the output was the model's own choice.
const RETRY_TERMINATOR_REGEX = /[.。．]\s*$/;

const ENDS_WITH_TERMINATOR = /[.!?。．！？…]\s*$/;

// Pattern to match placeholders in property values
const PLACEHOLDER_REGEX = /\{[0-9a-zA-Z_,.#:\s]+\}|\$\{[0-9a-zA-Z_.:-]+\}|%[0-9]*\$?[-+#0-9.]*[a-zA-Z]/g;

// Control characters are masked alongside placeholders because the translation
// model normalizes whitespace: a raw \n or \t sent to it comes back as a space,
// silently destroying the escape sequence in the output file. The full C0 range
// and DEL are covered because \uXXXX escapes can decode to any of them.
const CONTROL_CHAR_REGEX = /[\x00-\x1f\x7f]/g;

// CORS is enforced by browsers only. Command-line clients (cli/translate_messages.rb,
// curl) send no Origin header and ignore these headers entirely, so tightening the
// allowlist here can never break them.
const DEFAULT_ALLOWED_ORIGINS = ["https://translatemessages.pages.dev"];

// Any localhost port is allowed so local.html and `npm run dev` work without config.
const LOCAL_ORIGIN_REGEX = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

// Non-safelisted response headers are invisible to cross-origin JavaScript unless
// named here: Content-Disposition carries the download filename and
// X-Translation-Failures the partial-failure count the frontend warns on.
const EXPOSED_HEADERS = "Content-Disposition, X-Translation-Failures";

function isOriginAllowed(origin: string, env: Env): boolean {
	if (LOCAL_ORIGIN_REGEX.test(origin)) {
		return true;
	}
	// Unset means "use the built-in list"; set-but-empty means "allow no browser
	// origin at all", which is what a CLI-only deployment wants. Treating the empty
	// string as unset would silently hand it the public demo's origin instead.
	const configured = env.ALLOWED_ORIGINS === undefined
		? DEFAULT_ALLOWED_ORIGINS
		: env.ALLOWED_ORIGINS.split(",").map(entry => entry.trim()).filter(Boolean);
	return configured.includes(origin);
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
	// Vary is set even when the origin is rejected, so a cache never replays one
	// origin's response — allow header included or not — to a different origin.
	const headers: Record<string, string> = { "Vary": "Origin" };

	const origin = request.headers.get("Origin");
	if (origin && isOriginAllowed(origin, env)) {
		headers["Access-Control-Allow-Origin"] = origin;
		headers["Access-Control-Expose-Headers"] = EXPOSED_HEADERS;
	}

	return headers;
}

// Structured logging helper for better observability
function logError(event: string, details: Record<string, unknown>): void {
	console.error(JSON.stringify({
		level: "error",
		event,
		timestamp: new Date().toISOString(),
		...details
	}));
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const cors = corsHeaders(request, env);

		// The frontend's multipart/form-data POST sets no custom headers, so it is a
		// CORS "simple request" and is never preflighted. OPTIONS is answered anyway
		// so clients that do send custom headers are not locked out.
		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: {
					...cors,
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
					"Access-Control-Max-Age": "86400"
				}
			});
		}

		// Applied to every response, including errors: without the allow header the
		// browser discards the body, so the frontend could not even show the reason.
		const response = await handleTranslation(request, env);
		for (const [name, value] of Object.entries(cors)) {
			response.headers.set(name, value);
		}
		return response;
	},
};

async function handleTranslation(request: Request, env: Env): Promise<Response> {
	if (request.method !== "POST") {
		return new Response("Invalid request method. Use POST.", { status: 405 });
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return new Response("Invalid request body. Expected multipart form data.", { status: 400 });
	}

	const fileEntry = formData.get("file");
	const languageEntry = formData.get("language");

	if (!(fileEntry instanceof File)) {
		return new Response("File parameter must be a file upload.", { status: 400 });
	}
	if (typeof languageEntry !== "string") {
		return new Response("Language parameter must be a string.", { status: 400 });
	}

	const file = fileEntry;
	const language = languageEntry;


	// Check file size (5MB limit)
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	if (file.size > MAX_FILE_SIZE) {
		return new Response("File too large. Maximum size is 5MB.", { status: 413 });
	}

	// Normalize and validate language code
	const normalizedLanguage = language.toLowerCase();
	const languageCode = normalizedLanguage.split("-")[0]; // Handle cases like "pt-BR"
	if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
		return new Response(`Unsupported language code: ${language}. Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`, { status: 400 });
	}

	// Absent from the frontend on purpose. The CLI and the comparison harness use it;
	// omitting it gives the deployment's configured default.
	const selectable = selectableModels(env);
	const modelEntry = formData.get("model");
	if (modelEntry !== null && (typeof modelEntry !== "string" || !selectable.includes(modelEntry as ModelChoice))) {
		return new Response(`Unsupported model. Choose one of: ${selectable.join(", ")}.`, { status: 400 });
	}
	const model = (modelEntry as ModelChoice | null) ?? defaultModel(env);

	const text = await file.text();

	const { translatedText, failedEntries, attemptedEntries, serviceErrors } = await translateMessages(text, languageCode, env, model);

	// Every attempted entry erroring at the API means the model or binding is down,
	// not that a few awkward strings tripped it up, so fail loudly rather than hand
	// back a file that looks translated but is not. This replaces an eager probe
	// translation that doubled the AI calls on every single request. Only true API
	// errors count: an entry rejected for lost markers still returns the caller's
	// file, with the failure reported in X-Translation-Failures.
	if (attemptedEntries > 0 && serviceErrors === attemptedEntries) {
		return new Response("Translation service error: no entries could be translated.", { status: 500 });
	}

	const filename = `messages_${languageCode}.properties`;

	const headers: Record<string, string> = {
		"Content-Disposition": `attachment; filename="${filename}"`,
		"Content-Type": "text/plain; charset=utf-8"
	};

	if (failedEntries > 0) {
		headers["X-Translation-Failures"] = String(failedEntries);
	}

	return new Response(translatedText, { headers });
}

interface TranslationResult {
	translatedText: string;
	failedEntries: number;
	serviceErrors: number;
	attemptedEntries: number;
}

async function translateMessages(text: string, targetLanguage: string, env: Env, model: ModelChoice): Promise<TranslationResult> {
	const newline = text.includes("\r\n") ? "\r\n" : "\n";
	const normalizedText = text.replace(/\r\n?/g, "\n");
	const lines = normalizedText.split("\n");
	const translatedLines = [...lines];
	const entries = buildEntries(lines);
	const BATCH_SIZE = 100; // Process up to 100 translations concurrently
	let failedEntries = 0;
	// Failures caused by the AI call itself throwing, as opposed to a translation
	// that came back unusable. Only these can mark the whole request as a 500.
	let serviceErrors = 0;
	// Entries actually sent to the model. Comments, blank lines and unparseable
	// lines are skipped rather than attempted, so counting them would make a
	// comment-heavy file look like a total translation failure.
	let attemptedEntries = 0;

	for (let i = 0; i < entries.length; i += BATCH_SIZE) {
		const batch = entries.slice(i, i + BATCH_SIZE);
		const translationPromises = batch.map(async (entry) => {
			const entryLines = entry.indexes.map((idx) => lines[idx]);
			const { translatedLines: translatedEntryLines, failed, attempted, serviceError } = await translateEntry(entryLines, targetLanguage, env, model);
			return { entry, translatedEntryLines, failed, attempted, serviceError };
		});
		const batchResults = await Promise.all(translationPromises);
		for (const { entry, translatedEntryLines, failed, attempted, serviceError } of batchResults) {
			if (attempted) {
				attemptedEntries++;
			}
			if (failed) {
				failedEntries++;
			}
			if (serviceError) {
				serviceErrors++;
			}
			entry.indexes.forEach((lineIndex, idx) => {
				translatedLines[lineIndex] = translatedEntryLines[idx];
			});
		}
	}

	const joined = translatedLines.join("\n");
	const translatedText = newline === "\n" ? joined : joined.replace(/\n/g, newline);
	return { translatedText, failedEntries, attemptedEntries, serviceErrors };
}

async function translateText(text: string, targetLanguage: string, env: Env, model: ModelChoice): Promise<string> {
	try {
		if (usesInstructPrompting(model)) {
			return await translateWithInstructModel(text, targetLanguage, env, model);
		}

		const response = await env.AI.run(
			TRANSLATION_MODELS[model].id,
			{
				text: text,
				source_lang: "en",
				target_lang: targetLanguage,
			}
		) as { translated_text?: string };

		return response.translated_text ?? "";
	} catch (error) {
		logError("translation_api_error", {
			targetLanguage,
			model,
			error: error instanceof Error ? error.message : String(error)
		});
		throw new Error(`Translation service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

// EXPERIMENTAL. Reached only via the `model=llama` form field; the default path is
// unchanged. An instruction-following model needs no placeholder masking -- it is
// told to copy placeholders verbatim and the result is verified the same way the
// masked path is -- which is the whole point of the comparison.
async function translateWithInstructModel(
	text: string,
	targetLanguage: string,
	env: Env,
	model: ModelChoice
): Promise<string> {
	const response = await env.AI.run(
		TRANSLATION_MODELS[model].id,
		{
			messages: [
				{ role: "system", content: instructSystemPrompt(targetLanguage) },
				{ role: "user", content: text }
			],
			// Deterministic output, so a rerun of the comparison is reproducible.
			temperature: 0,
			max_tokens: 1024
		} as never
	) as { response?: string };

	return cleanInstructOutput(response.response ?? "");
}

function instructSystemPrompt(targetLanguage: string): string {
	const languageName = describeLanguage(targetLanguage);
	return [
		`You translate strings from a Java .properties file from English into ${languageName}.`,
		"",
		"Rules:",
		"- Reply with the translation only. No quotes, no preamble, no explanation, no notes.",
		"- Copy every placeholder exactly as written, including {0}, {1}, ${name}, %s and %d.",
		`- Copy any ${SEGMENT_DELIMITER} token exactly; it separates parts of one string.`,
		`- Copy any ${PLACEHOLDER_MARKER_PREFIX} token followed by digits exactly.`,
		"- Translate the wording only. Do not add, drop or reorder content.",
		"- If the input is a single word or fragment, translate it as-is."
	].join("\n");
}

// Small instruct models leak conversational scaffolding even when told not to.
// Stripping it here keeps the comparison about translation quality rather than
// about prompt obedience.
function cleanInstructOutput(raw: string): string {
	let text = raw.trim();
	text = text.replace(/^(?:translation|traduction|output)\s*:\s*/i, "");

	// A value can never legitimately contain a raw newline at this point: real newlines
	// in the source were masked as control characters, and multi-line entries are joined
	// with SEGMENT_DELIMITER rather than newlines. So anything past the first line is
	// the model talking to us -- observed as
	// `Saw\n\n(No change, as "Save" is a single word)` landing in the output file.
	// Note this cannot catch a note the model appends on the same line.
	const firstLineBreak = text.search(/[\r\n]/);
	if (firstLineBreak !== -1) {
		text = text.slice(0, firstLineBreak);
	}

	// Unwrap a fully quoted response, but leave quotes that are part of the string.
	const quoted = text.match(/^"([\s\S]*)"$/) ?? text.match(/^'([\s\S]*)'$/);
	if (quoted && !quoted[1].includes('"')) {
		text = quoted[1];
	}
	return text.trim();
}

function describeLanguage(code: string): string {
	try {
		const name = new Intl.DisplayNames(["en"], { type: "language" }).of(code);
		// Intl echoes the input back when it has no name for the code.
		return name && name !== code ? name : `the language with ISO code "${code}"`;
	} catch {
		return `the language with ISO code "${code}"`;
	}
}

// One translation attempt: returns the fully restored per-segment values, or null if
// the result is unusable and the caller should give up or retry. Never returns a
// partially usable result -- a caller that wrote one out would be shipping a file
// with placeholders missing, invented, or with model commentary in them.
async function translateSegments(
	combinedValue: string,
	maskedSegments: MaskedSegment[],
	sourceValues: string[],
	model: ModelChoice,
	targetLanguage: string,
	stripTrailingTerminator: boolean,
	env: Env
): Promise<string[] | null> {
	const translatedCombined = await translateText(combinedValue, targetLanguage, env, model);
	const translatedSegments = translatedCombined.split(SEGMENT_DELIMITER).map(normalizeMarkers);

	if (translatedSegments.length !== maskedSegments.length) {
		return null;
	}

	// Checked per segment: a marker the model relocated across a segment boundary is
	// just as unrestorable as one it mangled, since each segment is restored with
	// only its own tokens.
	const lostMarkers = maskedSegments.some(
		(masked, idx) => !markersSurvived(translatedSegments[idx], masked)
	);
	if (lostMarkers) {
		return null;
	}

	const lastIndex = maskedSegments.length - 1;
	const restored = translatedSegments.map((segment, idx) => {
		// Drop the padding space introduced by the join. Continuation values never
		// begin with whitespace (parseContinuationLine moves it into the prefix), so
		// any leading whitespace here is an artifact.
		const withoutJoinPadding = idx === 0 ? segment : segment.replace(/^[ \t]+/, "");
		// Remove only a terminator we introduced ourselves, and only from the tail
		// segment where it was appended. Punctuation the model chose is left alone.
		const withoutRetryTerminator = stripTrailingTerminator && idx === lastIndex
			? withoutJoinPadding.replace(RETRY_TERMINATOR_REGEX, "")
			: withoutJoinPadding;
		return restorePlaceholders(withoutRetryTerminator, maskedSegments[idx].tokens);
	});

	// Verified against the restored value rather than the raw reply, because that is
	// what actually reaches the file. An instruction-following model will invent a
	// placeholder that was never in the source -- observed in the low-resource sweep,
	// where a value with no placeholder came back containing {0} -- and a literal {0}
	// in a Spring message is a production bug, not a cosmetic one.
	const inventedPlaceholders = restored.some((value, idx) => hasUnexpectedPlaceholders(sourceValues[idx], value));

	return inventedPlaceholders ? null : restored;
}

// True when the translation carries a placeholder the source did not, or carries one
// more times than the source did.
function hasUnexpectedPlaceholders(sourceValue: string, translatedValue: string): boolean {
	const allowed = new Map<string, number>();
	for (const placeholder of sourceValue.match(PLACEHOLDER_REGEX) ?? []) {
		allowed.set(placeholder, (allowed.get(placeholder) ?? 0) + 1);
	}

	const seen = new Map<string, number>();
	for (const placeholder of translatedValue.match(PLACEHOLDER_REGEX) ?? []) {
		const count = (seen.get(placeholder) ?? 0) + 1;
		seen.set(placeholder, count);
		if (count > (allowed.get(placeholder) ?? 0)) {
			return true;
		}
	}

	return false;
}

interface EntryTranslationResult {
	translatedLines: string[];
	failed: boolean;
	// False when the entry was never sent to the model (comment, blank, unparseable,
	// or carrying text that would collide with our internal markers).
	attempted: boolean;
	// True only when the AI call itself threw. An entry whose translation came back
	// unusable (segments miscounted, markers lost) is a failed entry but not evidence
	// that the service is down, so it must not be able to turn the whole request into
	// a 500 -- the caller still gets their file, with the failure counted in the header.
	serviceError: boolean;
}

async function translateEntry(lines: string[], targetLanguage: string, env: Env, model: ModelChoice): Promise<EntryTranslationResult> {
	const firstLine = lines[0];
	const trimmedFirstLine = firstLine.trim();

	if (!trimmedFirstLine || trimmedFirstLine.startsWith("#") || trimmedFirstLine.startsWith("!")) {
		return { translatedLines: lines, failed: false, attempted: false, serviceError: false };
	}

	const segments: Segment[] = [];
	const firstSegment = parseFirstLine(firstLine);
	if (!firstSegment) {
		return { translatedLines: lines, failed: false, attempted: false, serviceError: false };
	}
	segments.push(firstSegment);

	for (let i = 1; i < lines.length; i++) {
		const segment = parseContinuationLine(lines[i]);
		segments.push(segment);
	}

	const unescapedValues = segments.map(segment => unescapePropertiesText(segment.value));

	if (unescapedValues.every(value => value === "")) {
		return { translatedLines: lines, failed: false, attempted: false, serviceError: false };
	}

	// Source text containing either internal marker would survive the round trip and
	// then be mangled on the way back out: SEGMENT_DELIMITER would split the entry
	// into the wrong number of segments, and a literal XQZ<n> would be rewritten by
	// restorePlaceholders into whatever placeholder happened to take that index.
	// Leaving such entries untranslated is the safe outcome.
	if (unescapedValues.some(value => value.includes(SEGMENT_DELIMITER) || value.includes(PLACEHOLDER_MARKER_PREFIX))) {
		return { translatedLines: lines, failed: false, attempted: false, serviceError: false };
	}

	const placeholderCounter = { current: 0 };
	const maskedSegments = unescapedValues.map(value => maskPlaceholders(value, placeholderCounter, !usesInstructPrompting(model)));
	// A trailing space keeps the delimiter from fusing to the following word, which
	// left that word untranslated. Continuation values already end with a space
	// before their backslash, so the left-hand side needs no padding.
	const combinedValue = maskedSegments.map(segment => segment.text).join(`${SEGMENT_DELIMITER} `);

	try {
		let restoredValues = await translateSegments(
			combinedValue, maskedSegments, unescapedValues, model, targetLanguage, false, env
		);

		// The model is deterministic -- the same input loses the same marker every
		// time -- so a plain retry is guaranteed to waste a call. Perturbing the input
		// is what actually changes the outcome, and only for an entry that would
		// otherwise ship untranslated.
		if (!restoredValues && !ENDS_WITH_TERMINATOR.test(combinedValue)) {
			restoredValues = await translateSegments(
				`${combinedValue}${RETRY_TERMINATOR}`, maskedSegments, unescapedValues, model, targetLanguage, true, env
			);
		}

		if (!restoredValues) {
			logError("entry_translation_unusable", {
				entryKey: firstLine.split(/[=:\s]/)[0]?.trim() || "unknown",
				targetLanguage
			});
			return { translatedLines: lines, failed: true, attempted: true, serviceError: false };
		}

		const translatedLines = segments.map((segment, idx) => {
			const escapedValue = escapePropertiesText(restoredValues[idx]);
			return `${segment.prefix}${escapedValue}${segment.suffix}`;
		});
		return { translatedLines, failed: false, attempted: true, serviceError: false };
	} catch (error) {
		logError("entry_translation_failed", {
			entryKey: firstLine.split(/[=:\s]/)[0]?.trim() || "unknown",
			error: error instanceof Error ? error.message : String(error)
		});
		return { translatedLines: lines, failed: true, attempted: true, serviceError: true };
	}
}

function parseFirstLine(line: string): Segment | null {
	const separatorIndex = findSeparatorIndex(line);
	if (!separatorIndex) {
		return null;
	}

	const { index, isWhitespace } = separatorIndex;
	let valueStart = isWhitespace ? index : index + 1;

	while (valueStart < line.length && /\s/.test(line[valueStart])) {
		valueStart++;
	}

	const prefix = line.slice(0, valueStart);
	const valuePortion = line.slice(valueStart);
	const { value, suffix } = extractValueAndSuffix(valuePortion);

	return {
		prefix,
		value,
		suffix,
	};
}
	
function parseContinuationLine(line: string): Segment {
	let valueStart = 0;

	while (valueStart < line.length && /\s/.test(line[valueStart])) {
		valueStart++;
	}

	const prefix = line.slice(0, valueStart);
	const valuePortion = line.slice(valueStart);
	const { value, suffix } = extractValueAndSuffix(valuePortion);

	return {
		prefix,
		value,
		suffix,
	};
}
	
function extractValueAndSuffix(valuePortion: string): { value: string; suffix: string } {
	if (!valuePortion) {
		return { value: "", suffix: "" };
	}

	const { content, inlineComment } = splitInlineComment(valuePortion);
	const match = content.match(/^(.*?)(\s*)$/);
	const baseValue = match ? match[1] : content;
	const trailingWhitespace = match ? match[2] : "";
	const { chunk, continuationSuffix } = stripContinuation(baseValue);

	return {
		value: chunk,
		suffix: `${trailingWhitespace}${continuationSuffix}${inlineComment}`,
	};
}
	
function stripContinuation(value: string): { chunk: string; continuationSuffix: string } {
	let backslashCount = 0;

	for (let i = value.length - 1; i >= 0 && value[i] === "\\"; i--) {
		backslashCount++;
	}

	if (backslashCount % 2 === 1) {
		const remainingBackslashes = Math.max(0, backslashCount - 1);
		const chunk = value.slice(0, value.length - backslashCount) + "\\".repeat(remainingBackslashes);
		return { chunk, continuationSuffix: "\\" };
	}

	return { chunk: value, continuationSuffix: "" };
}

function splitInlineComment(valuePortion: string): { content: string; inlineComment: string } {
	let escaped = false;

	for (let i = 0; i < valuePortion.length; i++) {
		const char = valuePortion[i];

		if (!escaped && (char === "#" || char === "!")) {
			const prevChar = i === 0 ? "" : valuePortion[i - 1];
			// #{...} is a JSF/Spring EL expression, not a comment. Treating it as one
			// silently dropped everything from the expression onward: a value starting
			// with #{...} was never translated at all, and one containing it mid-string
			// was translated only up to that point, leaving the tail in English with no
			// failure reported. Measured on a real JSF messages file, that hit 5 of 373
			// entries -- including a legal privacy string.
			const startsElExpression = char === "#" && valuePortion[i + 1] === "{";
			if (!startsElExpression && (i === 0 || /\s/.test(prevChar))) {
				return {
					content: valuePortion.slice(0, i),
					inlineComment: valuePortion.slice(i),
				};
			}
		}

		if (char === "\\" && !escaped) {
			escaped = true;
			continue;
		}

		escaped = false;
	}

	return { content: valuePortion, inlineComment: "" };
}

function buildEntries(lines: string[]): Array<{ indexes: number[] }> {
	const entries: Array<{ indexes: number[] }> = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
			entries.push({ indexes: [i] });
			i++;
			continue;
		}

		const indexes = [i];
		while (lineHasContinuation(lines[indexes[indexes.length - 1]]) && indexes[indexes.length - 1] + 1 < lines.length) {
			const nextIndex = indexes[indexes.length - 1] + 1;
			indexes.push(nextIndex);
		}

		entries.push({ indexes });
		i = indexes[indexes.length - 1] + 1;
	}

	return entries;
}
	
function lineHasContinuation(line: string): boolean {
	let idx = line.length - 1;

	while (idx >= 0 && (line[idx] === " " || line[idx] === "\t" || line[idx] === "\f")) {
		idx--;
	}

	let backslashCount = 0;
	while (idx >= 0 && line[idx] === "\\") {
		backslashCount++;
		idx--;
	}

	return backslashCount % 2 === 1;
}
	
function findSeparatorIndex(line: string): { index: number; isWhitespace: boolean } | null {
	const symbolIndex = findFirstSymbolSeparator(line);
	if (symbolIndex !== null) {
		return { index: symbolIndex, isWhitespace: false };
	}

	const whitespaceIndex = findFirstWhitespaceSeparator(line);
	return whitespaceIndex !== null ? { index: whitespaceIndex, isWhitespace: true } : null;
}
	
function findFirstSymbolSeparator(line: string): number | null {
	let escaped = false;
	let sawNonWhitespace = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (!escaped && (char === " " || char === "\t" || char === "\f")) {
			if (sawNonWhitespace) {
				continue;
			}
			continue;
		}

		if (!escaped && (char === "=" || char === ":")) {
			return i;
		}

		if (char === "\\" && !escaped) {
			escaped = true;
			sawNonWhitespace = true;
			continue;
		}

		escaped = false;
		sawNonWhitespace = true;
	}

	return null;
}
	
function findFirstWhitespaceSeparator(line: string): number | null {
	let escaped = false;
	let sawNonWhitespace = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (!escaped && (char === " " || char === "\t" || char === "\f")) {
			if (sawNonWhitespace) {
				return i;
			}
			continue;
		}

		if (char === "\\" && !escaped) {
			escaped = true;
			sawNonWhitespace = true;
			continue;
		}

		escaped = false;
		sawNonWhitespace = true;
	}

	return null;
}

function unescapePropertiesText(value: string): string {
	const result: string[] = [];

	for (let i = 0; i < value.length; i++) {
		const char = value[i];

		if (char !== "\\") {
			result.push(char);
			continue;
		}

		if (i === value.length - 1) {
			result.push("\\");
			break;
		}

		i++;
		const nextChar = value[i];

		switch (nextChar) {
			case "t":
				result.push("\t");
				break;
			case "r":
				result.push("\r");
				break;
			case "n":
				result.push("\n");
				break;
			case "f":
				result.push("\f");
				break;
			case "u": {
				const hex = value.slice(i + 1, i + 5);
				if (/^[0-9a-fA-F]{4}$/.test(hex)) {
					result.push(String.fromCharCode(parseInt(hex, 16)));
					i += 4;
				} else {
					result.push("\\u");
				}
				break;
			}
			default:
				result.push(nextChar);
				break;
		}
	}

	return result.join("");
}

function escapePropertiesText(value: string): string {
	const result: string[] = [];

	for (const char of value) {
		switch (char) {
			case "\\":
				result.push("\\\\");
				break;
			case "\t":
				result.push("\\t");
				break;
			case "\r":
				result.push("\\r");
				break;
			case "\n":
				result.push("\\n");
				break;
			case "\f":
				result.push("\\f");
				break;
			case "=":
			case ":":
			case "#":
			case "!":
				result.push(`\\${char}`);
				break;
			default: {
				const code = char.charCodeAt(0);
				if (code < 0x20 || code > 0x7e) {
					result.push(`\\u${code.toString(16).padStart(4, "0")}`);
				} else {
					result.push(char);
				}
			}
		}
	}

	return result.join("");
}

function maskPlaceholders(
	value: string,
	counter: { current: number },
	// False for an instruction-following model, which is asked to copy placeholders
	// rather than have them hidden behind markers. Control characters are masked
	// either way: no model reliably round-trips a raw tab or newline.
	maskPlaceholderTokens = true
): MaskedSegment {
	const tokens: PlaceholderToken[] = [];
	const mask = (match: string) => {
		const marker = `${PLACEHOLDER_MARKER_PREFIX}${counter.current++}`;
		tokens.push({ marker, original: match });
		return marker;
	};

	const literalPlaceholders = maskPlaceholderTokens ? [] : (value.match(PLACEHOLDER_REGEX) ?? []);
	const text = (maskPlaceholderTokens ? value.replace(PLACEHOLDER_REGEX, mask) : value)
		.replace(CONTROL_CHAR_REGEX, mask);

	return { text, tokens, literalPlaceholders };
}

function restorePlaceholders(text: string, tokens: PlaceholderToken[]): string {
	// Longest marker first: the markers carry no terminator, so restoring XQZ1
	// before XQZ10 would consume that marker's prefix and strand a loose "0".
	const ordered = [...tokens].sort((a, b) => b.marker.length - a.marker.length);

	let restored = text;
	for (const token of ordered) {
		restored = restored.split(token.marker).join(token.original);
	}

	return restored;
}

// The model sometimes returns a marker with whitespace inserted or its case altered
// ("XQZ 0", "xqz0"). Canonicalising those before matching recovers the placeholder
// without spending another call. Safe because the collision guard rejects any source
// text containing the prefix, so every marker-shaped run in a translation started
// life as one of ours.
const MARKER_VARIANT_REGEX = new RegExp(`${PLACEHOLDER_MARKER_PREFIX}\\s*(\\d+)`, "gi");

function normalizeMarkers(text: string): string {
	return text.replace(MARKER_VARIANT_REGEX, (_match, index: string) => `${PLACEHOLDER_MARKER_PREFIX}${index}`);
}

// Restoration matches markers exactly, so a marker the model dropped or mangled can
// never be matched and its placeholder would vanish from the output without trace.
// Checking first turns that silent corruption into an ordinary entry failure, which
// falls back to the untranslated original and is reported via X-Translation-Failures.
function markersSurvived(text: string, masked: MaskedSegment): boolean {
	// Counted rather than merely present: a value with two identical placeholders
	// must come back with both, not with one silently dropped.
	const literalsSurvived = masked.literalPlaceholders.every(placeholder => {
		const needed = masked.literalPlaceholders.filter(entry => entry === placeholder).length;
		return occurrences(text, placeholder) >= needed;
	});

	return literalsSurvived && masked.tokens.every(token => text.includes(token.marker));
}

function occurrences(haystack: string, needle: string): number {
	return needle ? haystack.split(needle).length - 1 : 0;
}

// Export parsing functions for testing
export {
	buildEntries,
	unescapePropertiesText,
	escapePropertiesText,
	maskPlaceholders,
	restorePlaceholders,
	parseFirstLine,
	parseContinuationLine,
	lineHasContinuation,
	SUPPORTED_LANGUAGES
};

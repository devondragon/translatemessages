export interface Env {
	AI: Pick<Ai, 'run'>;
	// Comma-separated list of browser origins allowed to read responses.
	// Set in wrangler.toml under [vars]; falls back to DEFAULT_ALLOWED_ORIGINS.
	ALLOWED_ORIGINS?: string;
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
	const configured = env.ALLOWED_ORIGINS
		? env.ALLOWED_ORIGINS.split(",").map(entry => entry.trim()).filter(Boolean)
		: DEFAULT_ALLOWED_ORIGINS;
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

	const text = await file.text();

	const { translatedText, failedEntries, attemptedEntries, serviceErrors } = await translateMessages(text, languageCode, env);

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

async function translateMessages(text: string, targetLanguage: string, env: Env): Promise<TranslationResult> {
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
			const { translatedLines: translatedEntryLines, failed, attempted, serviceError } = await translateEntry(entryLines, targetLanguage, env);
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

async function translateText(text: string, targetLanguage: string, env: Env): Promise<string> {
	try {
		const response = await env.AI.run(
			"@cf/meta/m2m100-1.2b",
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
			error: error instanceof Error ? error.message : String(error)
		});
		throw new Error(`Translation service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
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

async function translateEntry(lines: string[], targetLanguage: string, env: Env): Promise<EntryTranslationResult> {
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
	const maskedSegments = unescapedValues.map(value => maskPlaceholders(value, placeholderCounter));
	// A trailing space keeps the delimiter from fusing to the following word, which
	// left that word untranslated. Continuation values already end with a space
	// before their backslash, so the left-hand side needs no padding.
	const combinedValue = maskedSegments.map(segment => segment.text).join(`${SEGMENT_DELIMITER} `);

	try {
		const translatedCombined = await translateText(combinedValue, targetLanguage, env);
		const translatedSegments = translatedCombined.split(SEGMENT_DELIMITER);

		if (translatedSegments.length !== segments.length) {
			return { translatedLines: lines, failed: true, attempted: true, serviceError: false };
		}

		// Checked before anything is written, and per segment: a marker the model
		// relocated across a segment boundary is just as unrestorable as one it
		// mangled, since each segment is restored with only its own tokens.
		const lostMarkers = segments.some(
			(_, idx) => !markersSurvived(translatedSegments[idx], maskedSegments[idx].tokens)
		);
		if (lostMarkers) {
			logError("placeholder_markers_lost", {
				entryKey: firstLine.split(/[=:\s]/)[0]?.trim() || "unknown",
				targetLanguage
			});
			return { translatedLines: lines, failed: true, attempted: true, serviceError: false };
		}

		const translatedLines = segments.map((segment, idx) => {
			// Drop the padding space introduced by the join. Continuation values never
			// begin with whitespace (parseContinuationLine moves it into the prefix),
			// so any leading whitespace here is an artifact.
			const translatedSegment = idx === 0
				? translatedSegments[idx]
				: translatedSegments[idx].replace(/^[ \t]+/, "");
			const restoredPlaceholders = restorePlaceholders(translatedSegment, maskedSegments[idx].tokens);
			const escapedValue = escapePropertiesText(restoredPlaceholders);
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
			if (i === 0 || /\s/.test(prevChar)) {
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

function maskPlaceholders(value: string, counter: { current: number }): { text: string; tokens: PlaceholderToken[] } {
	const tokens: PlaceholderToken[] = [];
	const mask = (match: string) => {
		const marker = `${PLACEHOLDER_MARKER_PREFIX}${counter.current++}`;
		tokens.push({ marker, original: match });
		return marker;
	};

	const text = value
		.replace(PLACEHOLDER_REGEX, mask)
		.replace(CONTROL_CHAR_REGEX, mask);

	return { text, tokens };
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

// Restoration matches markers exactly, so a marker the model dropped or mangled can
// never be matched and its placeholder would vanish from the output without trace.
// Checking first turns that silent corruption into an ordinary entry failure, which
// falls back to the untranslated original and is reported via X-Translation-Failures.
function markersSurvived(text: string, tokens: PlaceholderToken[]): boolean {
	return tokens.every(token => text.includes(token.marker));
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

export interface Env {
	AI: Pick<Ai, 'run'>;
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

// Delimiter used to separate segments in multi-line properties
const SEGMENT_DELIMITER = "\u241E";

// Pattern to match placeholders in property values
const PLACEHOLDER_REGEX = /\{[0-9a-zA-Z_,.#:\s]+\}|\$\{[0-9a-zA-Z_.:-]+\}|%[0-9]*\$?[-+#0-9.]*[a-zA-Z]/g;

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

		// Perform a test translation before processing all messages
		try {
			const testText = "test"; // Simple test string
			await translateText(testText, languageCode, env);
		} catch (error) {
			return new Response(`Translation service error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
		}

		const { translatedText, failedEntries } = await translateMessages(text, languageCode, env);

		const filename = `messages_${languageCode}.properties`;

		const headers: Record<string, string> = {
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Content-Type": "text/plain; charset=utf-8"
		};

		if (failedEntries > 0) {
			headers["X-Translation-Failures"] = String(failedEntries);
		}

		return new Response(translatedText, { headers });
	},
};

interface TranslationResult {
	translatedText: string;
	failedEntries: number;
}

async function translateMessages(text: string, targetLanguage: string, env: Env): Promise<TranslationResult> {
	const newline = text.includes("\r\n") ? "\r\n" : "\n";
	const normalizedText = text.replace(/\r\n?/g, "\n");
	const lines = normalizedText.split("\n");
	const translatedLines = [...lines];
	const entries = buildEntries(lines);
	const BATCH_SIZE = 100; // Process up to 100 translations concurrently
	let failedEntries = 0;

	for (let i = 0; i < entries.length; i += BATCH_SIZE) {
		const batch = entries.slice(i, i + BATCH_SIZE);
		const translationPromises = batch.map(async (entry) => {
			const entryLines = entry.indexes.map((idx) => lines[idx]);
			const { translatedLines: translatedEntryLines, failed } = await translateEntry(entryLines, targetLanguage, env);
			return { entry, translatedEntryLines, failed };
		});
		const batchResults = await Promise.all(translationPromises);
		for (const { entry, translatedEntryLines, failed } of batchResults) {
			if (failed) {
				failedEntries++;
			}
			entry.indexes.forEach((lineIndex, idx) => {
				translatedLines[lineIndex] = translatedEntryLines[idx];
			});
		}
	}

	const joined = translatedLines.join("\n");
	const translatedText = newline === "\n" ? joined : joined.replace(/\n/g, newline);
	return { translatedText, failedEntries };
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
}

async function translateEntry(lines: string[], targetLanguage: string, env: Env): Promise<EntryTranslationResult> {
	const firstLine = lines[0];
	const trimmedFirstLine = firstLine.trim();

	if (!trimmedFirstLine || trimmedFirstLine.startsWith("#") || trimmedFirstLine.startsWith("!")) {
		return { translatedLines: lines, failed: false };
	}

	const segments: Segment[] = [];
	const firstSegment = parseFirstLine(firstLine);
	if (!firstSegment) {
		return { translatedLines: lines, failed: false };
	}
	segments.push(firstSegment);

	for (let i = 1; i < lines.length; i++) {
		const segment = parseContinuationLine(lines[i]);
		segments.push(segment);
	}

	const unescapedValues = segments.map(segment => unescapePropertiesText(segment.value));

	if (unescapedValues.every(value => value === "")) {
		return { translatedLines: lines, failed: false };
	}

	if (unescapedValues.some(value => value.includes(SEGMENT_DELIMITER))) {
		return { translatedLines: lines, failed: false };
	}

	const placeholderCounter = { current: 0 };
	const maskedSegments = unescapedValues.map(value => maskPlaceholders(value, placeholderCounter));
	const combinedValue = maskedSegments.map(segment => segment.text).join(SEGMENT_DELIMITER);

	try {
		const translatedCombined = await translateText(combinedValue, targetLanguage, env);
		const translatedSegments = translatedCombined.split(SEGMENT_DELIMITER);

		if (translatedSegments.length !== segments.length) {
			return { translatedLines: lines, failed: true };
		}

		const translatedLines = segments.map((segment, idx) => {
			const restoredPlaceholders = restorePlaceholders(translatedSegments[idx], maskedSegments[idx].tokens);
			const escapedValue = escapePropertiesText(restoredPlaceholders);
			return `${segment.prefix}${escapedValue}${segment.suffix}`;
		});
		return { translatedLines, failed: false };
	} catch (error) {
		logError("entry_translation_failed", {
			entryKey: firstLine.split(/[=:\s]/)[0]?.trim() || "unknown",
			error: error instanceof Error ? error.message : String(error)
		});
		return { translatedLines: lines, failed: true };
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
	const text = value.replace(PLACEHOLDER_REGEX, (match) => {
		const marker = `__PH_${counter.current++}__`;
		tokens.push({ marker, original: match });
		return marker;
	});

	return { text, tokens };
}

function restorePlaceholders(text: string, tokens: PlaceholderToken[]): string {
	let restored = text;

	for (const token of tokens) {
		restored = restored.split(token.marker).join(token.original);
	}

	return restored;
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

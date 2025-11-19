import { Ai } from "@cloudflare/ai";

export interface Env {
	AI: Ai;
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

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Invalid request method. Use POST.", { status: 405 });
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;
		const language = formData.get("language") as string;

		if (!file || !language) {
			return new Response("File and language parameters are required.", { status: 400 });
		}

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

		const translatedText = await translateMessages(text, languageCode, env);

		const filename = `messages_${languageCode}.properties`;

		return new Response(translatedText, {
			headers: {
				"Content-Disposition": `attachment; filename="${filename}"`,
				"Content-Type": "text/plain"
			}
		});
	},
};

async function translateMessages(text: string, targetLanguage: string, env: Env): Promise<string> {
	const newline = text.includes("\r\n") ? "\r\n" : "\n";
	const normalizedText = text.replace(/\r\n?/g, "\n");
	const lines = normalizedText.split("\n");
	const translatedLines = [...lines];
	const BATCH_SIZE = 100; // Process up to 100 translations concurrently

	for (let i = 0; i < lines.length; i += BATCH_SIZE) {
		const batch = lines.slice(i, i + BATCH_SIZE);
		const translationPromises = batch.map((line) => translateLine(line, targetLanguage, env));
		const batchResults = await Promise.all(translationPromises);
		for (let j = 0; j < batchResults.length; j++) {
			translatedLines[i + j] = batchResults[j];
		}
	}

	const joined = translatedLines.join("\n");
	return newline === "\n" ? joined : joined.replace(/\n/g, newline);
}

async function translateText(text: string, targetLanguage: string, env: Env): Promise<string> {
	try {
		const response = await env.AI.run<"@cf/meta/m2m100-1.2b">(
			"@cf/meta/m2m100-1.2b",
			{
				text: text,
				source_lang: "en", // Assuming English is the default
				target_lang: targetLanguage,
			}
		);

		return response.translated_text;
	} catch (error) {
		console.error("Translation API error: ", error);
		throw new Error(`Translation service failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

	async function translateLine(line: string, targetLanguage: string, env: Env): Promise<string> {
		const trimmedLine = line.trim();
	
		// Preserve blank lines and comments (starting with # or !)
		if (!trimmedLine || trimmedLine.startsWith("#") || trimmedLine.startsWith("!")) {
			return line;
		}
	
		const separatorIndex = findSeparatorIndex(line);
		if (!separatorIndex) {
			return line;
		}
	
		const { index, isWhitespace } = separatorIndex;
		let valueStart = isWhitespace ? index : index + 1;
	
		while (valueStart < line.length && /\s/.test(line[valueStart])) {
			valueStart++;
		}
	
		const prefix = line.slice(0, valueStart);
		const valueAndTrailing = line.slice(valueStart);
		const match = valueAndTrailing.match(/^(.*?)(\s*)$/);
	
		if (!match) {
			return line;
		}
	
		const [, rawValue, trailingWhitespace] = match;
		if (!rawValue) {
			return line;
		}
	
		try {
			const translatedValue = await translateText(rawValue, targetLanguage, env);
			return `${prefix}${translatedValue}${trailingWhitespace}`;
		} catch (error) {
			console.error(`Failed to translate line "${line}":`, error);
			return line;
		}
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

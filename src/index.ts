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
		if (request.method === "POST") {
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

			// Validate language code
			const languageCode = language.toLowerCase().split("-")[0]; // Handle cases like "pt-BR"
			if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
				return new Response(`Unsupported language code: ${language}. Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`, { status: 400 });
			}

			const text = await file.text();

			// Perform a test translation before processing all messages
			try {
				const testText = "test"; // Simple test string
				await translateText(testText, language, env);
			} catch (error) {
				return new Response(`Translation service error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
			}

			const translatedText = await translateMessages(text, language, env);

			const languageSuffix = language.toLowerCase().split("-")[0];
			const filename = `messages_${languageSuffix}.properties`;

			return new Response(translatedText, {
				headers: {
					"Content-Disposition": `attachment; filename="${filename}"`,
					"Content-Type": "text/plain"
				}
			});
		} else {
			return new Response("Invalid request method. Use POST.", { status: 405 });
		}
	},
};

async function translateMessages(text: string, targetLanguage: string, env: Env): Promise<string> {
	const messages = text.split("\n").filter(line => line && !line.startsWith("#"));
	const BATCH_SIZE = 100; // Process up to 100 translations concurrently
	const results: string[] = [];

	// Process messages in batches to avoid overwhelming the AI service
	for (let i = 0; i < messages.length; i += BATCH_SIZE) {
		const batch = messages.slice(i, i + BATCH_SIZE);
		
		// Map each message to a promise that resolves to the translated message
		const translationPromises = batch.map(async (message) => {
			const equalIndex = message.indexOf("=");
			if (equalIndex === -1) {
				// Skip lines without = sign
				return message;
			}
			
			const key = message.substring(0, equalIndex);
			const value = message.substring(equalIndex + 1);
			
			try {
				const translatedValue = await translateText(value, targetLanguage, env);
				return `${key}= ${translatedValue}`;
			} catch (error) {
				// If translation fails for this line, keep original
				console.error(`Failed to translate key "${key}":`, error);
				return message;
			}
		});

		// Process batch concurrently
		const batchResults = await Promise.all(translationPromises);
		results.push(...batchResults);
	}

	return results.join("\n");
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

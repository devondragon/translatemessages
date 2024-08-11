import { Ai } from "@cloudflare/ai";

export interface Env {
	AI: Ai;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === "POST") {
			const formData = await request.formData();
			const file = formData.get("file");
			const language = formData.get("language");

			if (!file || !language) {
				return new Response("File and language parameters are required.", { status: 400 });
			}

			const text = await file.text();

			// Perform a test translation before processing all messages
			const testText = "test"; // Simple test string
			const testTranslation = await translateText(testText, language, env);

			if (testTranslation.startsWith("ERROR:")) {
				return new Response("Translation service error: " + testTranslation, { status: 500 });
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

	// Map each message to a promise that resolves to the translated message
	const translationPromises = messages.map(async (message) => {
		const [key, value] = message.split("=");
		const translatedValue = await translateText(value, targetLanguage, env);
		return `${key}= ${translatedValue}`;
	});

	// Use Promise.all to run all translation calls in parallel
	const translatedMessages = await Promise.all(translationPromises);

	return translatedMessages.join("\n");
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
		return "ERROR: Translation service failed"; // Return error message if translation fails
	}
}

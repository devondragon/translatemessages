/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
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
		 //console.log("translatedValue: " + translatedValue);
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

		 //console.log("response: ", response);

		 return response.translated_text;
	 } catch (error) {
		 console.error("Translation API error: ", error);
		 return text; // Fallback to original text if translation fails
	 }
 }



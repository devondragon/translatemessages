// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('TranslateMessages Worker', () => {
	it('rejects non-POST requests', async () => {
		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(405);
		expect(await response.text()).toBe("Invalid request method. Use POST.");
	});

	it('requires file and language parameters', async () => {
		const formData = new FormData();
		// Missing both file and language
		
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(400);
		expect(await response.text()).toBe("File and language parameters are required.");
	});

	it('rejects files larger than 5MB', async () => {
		const formData = new FormData();
		// Create a fake file larger than 5MB
		const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
		const file = new File([largeContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(413);
		expect(await response.text()).toBe("File too large. Maximum size is 5MB.");
	});

	it('validates language codes', async () => {
		const formData = new FormData();
		const file = new File(['test=Test'], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'invalid-lang');
		
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(400);
		const responseText = await response.text();
		expect(responseText).toContain("Unsupported language code: invalid-lang");
	});

	it('handles translation API errors gracefully', async () => {
		// Mock the AI service to throw an error
		const mockEnv = {
			...env,
			AI: {
				run: vi.fn().mockRejectedValue(new Error('AI service unavailable'))
			}
		};
		
		const formData = new FormData();
		const file = new File(['test=Test'], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(500);
		const responseText = await response.text();
		expect(responseText).toContain("Translation service error");
	});

	it('normalizes language codes and preserves formatting during translation', async () => {
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ translated_text: 'ok' }) // probe call
			.mockResolvedValueOnce({ translated_text: 'Bonjour' })
			.mockResolvedValueOnce({ translated_text: 'Au revoir' });

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "# Heading\r\n\r\n greeting=Hello\r\nfarewell = Goodbye\r\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'FR-ca');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("# Heading\r\n\r\n greeting=Bonjour\r\nfarewell = Au revoir\r\n");
		expect(response.headers.get('Content-Disposition')).toContain('messages_fr.properties');

		const targetLangs = mockRun.mock.calls.map(([, args]) => args.target_lang);
		expect(targetLangs.every((lang) => lang === 'fr')).toBe(true);
	});

	it('translates entries that use colon or whitespace separators', async () => {
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ translated_text: 'ok' })
			.mockResolvedValueOnce({ translated_text: 'Salut' })
			.mockResolvedValueOnce({ translated_text: 'Au revoir' });

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "colon:Hi\nspace\tBye\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("colon:Salut\nspace\tAu revoir\n");
	});

	it('handles multi-line entries using continuations', async () => {
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ translated_text: 'ok' })
			.mockResolvedValueOnce({ translated_text: 'Bonjour \u241EMonde' });

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "multi=Hello \\\n  World\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("multi=Bonjour \\\n  Monde\n");
	});
});

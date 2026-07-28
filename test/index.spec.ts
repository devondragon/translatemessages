// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker, { type Env } from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

function buildForm(content: string, language: string, model?: string): FormData {
	const formData = new FormData();
	formData.append('file', new File([content], 'messages.properties', { type: 'text/plain' }));
	formData.append('language', language);
	if (model !== undefined) {
		formData.append('model', model);
	}
	return formData;
}

describe('TranslateMessages Worker', () => {
	it('rejects non-POST requests', async () => {
		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env as Env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(405);
		expect(await response.text()).toBe("Invalid request method. Use POST.");
	});

	it('requires file parameter to be a file upload', async () => {
		const formData = new FormData();
		// Missing file - only has language
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env as Env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("File parameter must be a file upload.");
	});

	it('requires language parameter to be a string', async () => {
		const formData = new FormData();
		const file = new File(['test=Test'], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		// Missing language

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env as Env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("Language parameter must be a string.");
	});

	it('rejects files larger than 5MB', async () => {
		const formData = new FormData();
		// Create a fake file larger than 5MB
		const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
		const file = new File([largeContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');
		
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env as Env, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(413);
		expect(await response.text()).toBe("File too large. Maximum size is 5MB.");
	});

	it('validates language codes', async () => {
		const formData = new FormData();
		const file = new File(['test=Test'], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'invalid-lang');
		formData.append('model', 'm2m100');
		
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env as Env, ctx);
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
		formData.append('model', 'm2m100');
		
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
		formData.append('model', 'm2m100');

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
		formData.append('model', 'm2m100');

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
			.mockResolvedValueOnce({ translated_text: 'Bonjour __SEG__Monde' });

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "multi=Hello \\\n  World\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

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

	it('unescapes and re-escapes property values during translation', async () => {
		// The masked tab comes back as its marker, not as a raw tab: a model that
		// returns the tab verbatim has destroyed the marker, which is a failed entry.
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ translated_text: 'Salut monde!\u00E9XQZ0Ligne\\Cassé' });

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "special=Hello\\ World\\!\\u00E9\\tLine\\\\Break\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("special=Salut monde\\!\\u00e9\\tLigne\\\\Cass\\u00e9\n");
	});

	it('preserves inline comments appended to values', async () => {
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ translated_text: 'Bonjour' });

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "commented=Hello  # note for translators\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("commented=Bonjour  # note for translators\n");
	});

	it('protects placeholder tokens during translation', async () => {
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ translated_text: 'Salut XQZ0! XQZ1 XQZ2' });

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "placeholder=Hello {0}! %s ${name}\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("placeholder=Salut {0}\\! %s ${name}\n");
	});

	it('preserves \\n and \\t escapes when the model normalizes whitespace', async () => {
		// The real m2m100 model collapses raw control characters to spaces, so any
		// control character sent to it verbatim comes back destroyed. Simulate that.
		const mockRun = vi.fn().mockImplementation((_model, args) =>
			Promise.resolve({ translated_text: args.text.replace(/[\n\t\r\f]/g, ' ') })
		);

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "message.escapes=First line\\nSecond line\\tTabbed value\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'es');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toContain('\\n');
		expect(body).toContain('\\t');

		// No raw control character may reach the model; only the masked marker form.
		const translated = mockRun.mock.calls.map(([, args]) => args.text);
		expect(translated.some((text) => /[\n\t\r\f]/.test(text))).toBe(false);
	});

	it('translates multi-line continuation entries when the model drops non-ASCII', async () => {
		// The real m2m100 model silently drops non-ASCII characters such as U+241E.
		// That destroyed segment splitting, so a correctly translated multi-line
		// entry was discarded and fell back to the untranslated original.
		const mockRun = vi.fn().mockImplementation((_model, args) =>
			Promise.resolve({ translated_text: args.text.replace(/[^\x00-\x7F]/g, '').toUpperCase() })
		);

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "multi=first part \\\n    second part \\\n    third part\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'es');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();

		// The uppercase marker proves the translation was kept rather than
		// discarded via the failed-segment-count fallback.
		expect(body).toContain('FIRST PART');
		expect(body).toContain('SECOND PART');
		expect(body).toContain('THIRD PART');
		// Continuation structure must still be intact.
		expect(body.split('\n').filter((l) => l.trim()).length).toBe(3);

		// The delimiter itself must be ASCII so the model can round-trip it.
		const sent = mockRun.mock.calls.map(([, args]) => args.text);
		expect(sent.some((text) => /[^\x00-\x7F]/.test(text))).toBe(false);
	});

	it('handles empty files gracefully', async () => {
		const mockRun = vi.fn();

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("");
		// Nothing to translate must cost nothing: no probe call, no AI invocation.
		expect(mockRun).not.toHaveBeenCalled();
	});

	it('handles files with only whitespace and comments', async () => {
		const mockRun = vi.fn();

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "# Header comment\n\n! Another comment\n   \n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("# Header comment\n\n! Another comment\n   \n");
		expect(mockRun).not.toHaveBeenCalled();
	});

	it('includes translation failure count in header when entries fail', async () => {
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ translated_text: 'Bonjour' })
			.mockRejectedValueOnce(new Error('Translation failed'));

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "greeting=Hello\nfarewell=Goodbye\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('X-Translation-Failures')).toBe('1');
		const body = await response.text();
		// First entry translated, second kept original due to failure
		expect(body).toBe("greeting=Bonjour\nfarewell=Goodbye\n");
	});

	it('includes charset in Content-Type header', async () => {
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ translated_text: 'Bonjour' });

		const mockEnv = {
			...env,
			AI: { run: mockRun }
		};

		const fileContent = "greeting=Hello\n";
		const formData = new FormData();
		const file = new File([fileContent], 'messages.properties', { type: 'text/plain' });
		formData.append('file', file);
		formData.append('language', 'fr');
		formData.append('model', 'm2m100');

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: formData
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
	});

	it('rejects malformed form data', async () => {
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: 'not-valid-form-data',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env as Env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("File parameter must be a file upload.");
	});

	it('spends exactly one AI call per translatable entry', async () => {
		const mockRun = vi.fn().mockResolvedValue({ translated_text: 'Bonjour' });
		const mockEnv = { ...env, AI: { run: mockRun } };

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello\n", 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		// One entry, one call. A second call would mean the removed probe translation
		// is back, doubling AI spend on every request.
		expect(mockRun).toHaveBeenCalledTimes(1);
	});

	it('fails with 500 when every translatable entry fails', async () => {
		const mockRun = vi.fn().mockRejectedValue(new Error('AI service unavailable'));
		const mockEnv = { ...env, AI: { run: mockRun } };

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello\nfarewell=Goodbye\n", 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		// A total outage must not return 200 with a silently untranslated file.
		expect(response.status).toBe(500);
		expect(await response.text()).toContain("Translation service error");
	});

	it('does not treat a comment-only file as a total failure', async () => {
		const mockRun = vi.fn().mockRejectedValue(new Error('AI service unavailable'));
		const mockEnv = { ...env, AI: { run: mockRun } };

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("# just a comment\n", 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		// Zero attempted entries is not the same as zero successful entries.
		expect(response.status).toBe(200);
	});

	it('falls back to the original when the model mangles a placeholder marker', async () => {
		// The real m2m100 model did exactly this to the old __PH_n__ markers, returning
		// PH_0 / _PH_0__ / PH_0__ roughly half the time. Restoration matches exactly, so
		// the placeholder used to vanish and literal marker debris shipped in its place.
		const mockRun = vi.fn().mockImplementation((_model, args) =>
			Promise.resolve({ translated_text: args.text.replace(/XQZ(\d+)/g, 'PH_$1') })
		);
		const mockEnv = { ...env, AI: { run: mockRun } };

		const fileContent = "greeting=Hello {0}\n";
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm(fileContent, 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		// Untranslated but intact beats translated with {0} destroyed, and the user is
		// told rather than left to discover it in production.
		expect(await response.text()).toBe(fileContent);
		expect(response.headers.get('X-Translation-Failures')).toBe('1');
	});

	it('recovers markers the model spaced out or changed the case of', async () => {
		// Cheap recovery: no extra call, just canonicalise before matching.
		const mockRun = vi.fn().mockImplementation((_model, args) =>
			Promise.resolve({ translated_text: args.text.replace('XQZ0', 'xqz 0') })
		);
		const mockEnv = { ...env, AI: { run: mockRun } };

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello {0} there\n", 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("greeting=Hello {0} there\n");
		expect(response.headers.get('X-Translation-Failures')).toBeNull();
		expect(mockRun).toHaveBeenCalledTimes(1);
	});

	it('retries a lost marker with a perturbed input rather than the same one', async () => {
		// m2m100 drops the marker from a two-token input like "Hi XQZ0" but keeps it
		// once the input ends in a period. The model is deterministic, so resending the
		// identical text would fail identically -- the perturbation is the whole point.
		const mockRun = vi.fn().mockImplementation((_model, args) =>
			args.text.endsWith('.')
				? Promise.resolve({ translated_text: 'Salut XQZ0.' })
				: Promise.resolve({ translated_text: 'Salut' })
		);
		const mockEnv = { ...env, AI: { run: mockRun } };

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("named=Hi {0}\n", 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		// The placeholder is back and the period we appended is not.
		expect(await response.text()).toBe("named=Salut {0}\n");
		expect(response.headers.get('X-Translation-Failures')).toBeNull();
		expect(mockRun).toHaveBeenCalledTimes(2);
		expect(mockRun.mock.calls[0][1].text).toBe('Hi XQZ0');
		expect(mockRun.mock.calls[1][1].text).toBe('Hi XQZ0.');
	});

	it('does not retry a value that already ends in punctuation', async () => {
		// The perturbation has nothing to add, so a second call could only burn quota.
		const mockRun = vi.fn().mockResolvedValue({ translated_text: 'Salut' });
		const mockEnv = { ...env, AI: { run: mockRun } };

		const fileContent = "named=Hi {0}.\n";
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm(fileContent, 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe(fileContent);
		expect(response.headers.get('X-Translation-Failures')).toBe('1');
		expect(mockRun).toHaveBeenCalledTimes(1);
	});

	it('keeps punctuation the model chose when the retry succeeds', async () => {
		// We appended a period; an exclamation mark is the model's own and must survive.
		const mockRun = vi.fn().mockImplementation((_model, args) =>
			args.text.endsWith('.')
				? Promise.resolve({ translated_text: 'Salut XQZ0!' })
				: Promise.resolve({ translated_text: 'Salut' })
		);
		const mockEnv = { ...env, AI: { run: mockRun } };

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("named=Hi {0}\n", 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("named=Salut {0}\\!\n");
	});

	it('restores double-digit placeholders without clobbering single-digit ones', async () => {
		// Markers carry no terminator, so XQZ1 is a prefix of XQZ10 and restoring in
		// token order would consume it and strand a loose "0".
		const mockRun = vi.fn().mockImplementation((_model, args) =>
			Promise.resolve({ translated_text: args.text })
		);
		const mockEnv = { ...env, AI: { run: mockRun } };

		const values = Array.from({ length: 12 }, (_, i) => `{${i}}`).join(' ');
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm(`many=${values}\n`, 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe(`many=${values}\n`);
	});

	it('leaves entries containing the placeholder marker untranslated', async () => {
		const mockRun = vi.fn().mockResolvedValue({ translated_text: 'Bonjour' });
		const mockEnv = { ...env, AI: { run: mockRun } };

		const fileContent = "literal=Value with XQZ0 inside\n";
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm(fileContent, 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		// Restoring placeholders is a plain string replace, so a literal marker in the
		// source would be rewritten into an unrelated placeholder. Skip instead.
		expect(await response.text()).toBe(fileContent);
		expect(mockRun).not.toHaveBeenCalled();
	});
});

describe('CORS', () => {
	const ALLOWED = 'https://translatemessages.pages.dev';

	function translateRequest(origin?: string): Request {
		return new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello\n", 'fr', 'm2m100'),
			...(origin ? { headers: { Origin: origin } } : {})
		});
	}

	async function post(request: Request, overrides: Partial<Env> = {}) {
		const mockEnv = {
			...env,
			AI: { run: vi.fn().mockResolvedValue({ translated_text: 'Bonjour' }) },
			...overrides
		};
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv as Env, ctx);
		await waitOnExecutionContext(ctx);
		return response;
	}

	it('allows the deployed Pages origin to read the response', async () => {
		const response = await post(translateRequest(ALLOWED));

		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED);
	});

	it('exposes the headers the frontend reads', async () => {
		const response = await post(translateRequest(ALLOWED));

		// Without this the frontend sees null for both: the download loses its
		// filename and the partial-failure warning never fires.
		const exposed = response.headers.get('Access-Control-Expose-Headers') ?? '';
		expect(exposed).toContain('Content-Disposition');
		expect(exposed).toContain('X-Translation-Failures');
	});

	it('allows any localhost port so local.html works without config', async () => {
		const response = await post(translateRequest('http://localhost:3000'));

		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
	});

	it('honours the ALLOWED_ORIGINS override', async () => {
		const response = await post(translateRequest('https://example.org'), {
			ALLOWED_ORIGINS: 'https://foo.test, https://example.org'
		});

		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.org');
	});

	it('allows no browser origin when ALLOWED_ORIGINS is set but empty', async () => {
		// A CLI-only deployment sets this empty. Treating "" as unset would silently
		// hand it the public demo's origin instead.
		const response = await post(translateRequest(ALLOWED), { ALLOWED_ORIGINS: '' });

		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
	});

	it('withholds the allow header from unlisted origins', async () => {
		const response = await post(translateRequest('https://evil.example'));

		expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
		// Vary is still required so a cache cannot replay an allowed origin's
		// response to a rejected one.
		expect(response.headers.get('Vary')).toBe('Origin');
	});

	it('sends CORS headers on error responses too', async () => {
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello\n", 'invalid-lang', 'm2m100'),
			headers: { Origin: ALLOWED }
		});
		const response = await post(request);

		expect(response.status).toBe(400);
		// Without the header the browser discards the body and the frontend cannot
		// show the user why the request failed.
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED);
		expect(await response.text()).toContain('Unsupported language code');
	});

	it('answers preflight requests', async () => {
		const request = new IncomingRequest('http://example.com', {
			method: 'OPTIONS',
			headers: { Origin: ALLOWED, 'Access-Control-Request-Method': 'POST' }
		});
		const response = await post(request);

		expect(response.status).toBe(204);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED);
		expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
	});

	it('serves origin-less clients such as the CLI unchanged', async () => {
		const response = await post(translateRequest());

		// CORS is a browser mechanism: cli/translate_messages.rb and curl send no
		// Origin and ignore these headers, so they must be unaffected.
		expect(response.status).toBe(200);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
		expect(await response.text()).toBe("greeting=Bonjour\n");
	});
});

// The llama backend is an experiment behind the `model` form field: it asks an
// instruction-following model to copy placeholders rather than masking them, so it
// can be compared against m2m100 on identical input. See scripts/compare-models.mjs.
describe('llama backend (experimental)', () => {
	function runWith(mockRun: ReturnType<typeof vi.fn>, content: string, model?: string) {
		// ReturnType<typeof vi.fn> is wider than the Ai.run signature, so the shared
		// helper needs the cast the inline mocks above get for free from inference.
		const mockEnv = { ...env, AI: { run: mockRun } } as unknown as Env;
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm(content, 'fr', model)
		});
		const ctx = createExecutionContext();
		return worker.fetch(request, mockEnv, ctx).then(async (response) => {
			await waitOnExecutionContext(ctx);
			return response;
		});
	}

	it('sends placeholders unmasked and keeps them in the output', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: '1. Bonjour {0}' });

		const response = await runWith(mockRun, "greeting=Hello {0}\n", 'llama-3.1-8b');

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("greeting=Bonjour {0}\n");

		const [modelId, args] = mockRun.mock.calls[0];
		expect(modelId).toBe('@cf/meta/llama-3.1-8b-instruct-fp8');
		// The whole hypothesis: the model sees the real placeholder, not a marker.
		expect(args.messages[1].content).toBe('1. Hello {0}');
		expect(args.messages[0].content).toContain('{0}');
	});

	it('defaults to llama-3.1-8b when no model is requested', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: '1. Bonjour {0}' });

		const response = await runWith(mockRun, "greeting=Hello {0}\n");

		expect(response.status).toBe(200);
		expect(mockRun.mock.calls[0][0]).toBe('@cf/meta/llama-3.1-8b-instruct-fp8');
		// The default no longer masks: the model is asked to copy the placeholder.
		expect(mockRun.mock.calls[0][1].messages[1].content).toBe('1. Hello {0}');
	});

	it('honours DEFAULT_MODEL when the deployment sets one', async () => {
		const mockRun = vi.fn().mockResolvedValue({ translated_text: 'Bonjour XQZ0' });
		const mockEnv = { ...env, AI: { run: mockRun }, DEFAULT_MODEL: 'm2m100' } as unknown as Env;

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello {0}\n", 'fr')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(mockRun.mock.calls[0][0]).toBe('@cf/meta/m2m100-1.2b');
	});

	it('falls back to a working model when DEFAULT_MODEL is nonsense', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: 'Bonjour' });
		const mockEnv = { ...env, AI: { run: mockRun }, DEFAULT_MODEL: 'gpt-9' } as unknown as Env;

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello\n", 'fr')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		// A mistyped var must degrade to a working deployment, not a broken one.
		expect(response.status).toBe(200);
		expect(mockRun.mock.calls[0][0]).toBe('@cf/meta/llama-3.1-8b-instruct-fp8');
	});

	it('refuses a model the deployment does not offer', async () => {
		const mockRun = vi.fn();
		const mockEnv = {
			...env, AI: { run: mockRun }, ALLOWED_MODELS: 'llama-3.1-8b'
		} as unknown as Env;

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello\n", 'fr', 'llama-3.3-70b')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		// Nothing rate-limits this endpoint, so a public deployment must not be
		// steerable onto a model that costs several times the default.
		expect(response.status).toBe(400);
		expect(await response.text()).toContain('Unsupported model');
		expect(mockRun).not.toHaveBeenCalled();
	});

	it('offers only the default when ALLOWED_MODELS is unset', async () => {
		const mockRun = vi.fn();
		const mockEnv = { ...env, AI: { run: mockRun }, ALLOWED_MODELS: undefined } as unknown as Env;

		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello\n", 'fr', 'llama-4-scout')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
		expect(mockRun).not.toHaveBeenCalled();
	});

	it('rejects an unknown model', async () => {
		const response = await runWith(vi.fn(), "greeting=Hello\n", 'gpt-9');

		expect(response.status).toBe(400);
		expect(await response.text()).toContain('Unsupported model');
	});

	it('fails the entry when the model drops a placeholder', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: 'Bonjour' });

		const response = await runWith(mockRun, "greeting=Hello {0}\n", 'llama-3.1-8b');

		// Same contract as the masked path: never ship a value with a placeholder
		// silently missing.
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("greeting=Hello {0}\n");
		expect(response.headers.get('X-Translation-Failures')).toBe('1');
	});

	it('fails the entry when a repeated placeholder comes back only once', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: 'Bonjour {0}' });

		const response = await runWith(mockRun, "greeting=Hello {0} and {0}\n", 'llama-3.1-8b');

		expect(await response.text()).toBe("greeting=Hello {0} and {0}\n");
		expect(response.headers.get('X-Translation-Failures')).toBe('1');
	});

	it('strips conversational scaffolding from the reply', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: '  Translation: "Bonjour {0}"  ' });

		const response = await runWith(mockRun, "greeting=Hello {0}\n", 'llama-3.1-8b');

		expect(await response.text()).toBe("greeting=Bonjour {0}\n");
	});

	it('rejects a placeholder the model invented', async () => {
		// Observed in the low-resource sweep: a source value with no placeholder came
		// back as "Welcoming ngal laawol \u0257uniyaarum {0}". A literal {0} reaching a
		// Spring message is a production bug, so the entry must fall back instead.
		const mockRun = vi.fn().mockResolvedValue({ response: 'Welcoming ngal laawol {0}' });

		const fileContent = "app.welcome=Welcome to your dashboard\n";
		const response = await runWith(mockRun, fileContent, 'llama-3.1-8b');

		expect(response.status).toBe(200);
		expect(await response.text()).toBe(fileContent);
		expect(response.headers.get('X-Translation-Failures')).toBe('1');
	});

	it('rejects a duplicated placeholder the source used only once', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: 'Bonjour {0} et {0}' });

		const fileContent = "greeting=Hello {0}\n";
		const response = await runWith(mockRun, fileContent, 'llama-3.1-8b');

		expect(await response.text()).toBe(fileContent);
		expect(response.headers.get('X-Translation-Failures')).toBe('1');
	});

	it('drops commentary the model appends after the translation', async () => {
		// Observed verbatim: `Saw\n\n(No change, as "Save" is a single word)` was written
		// into the value. A value cannot contain a raw newline at that point, so
		// anything past the first line is the model talking to us.
		const mockRun = vi.fn().mockResolvedValue({
			response: 'Sauvegarder\n\n(No change, as "Save" is a single word)'
		});

		const response = await runWith(mockRun, "button.save=Save\n", 'llama-3.1-8b');

		expect(await response.text()).toBe("button.save=Sauvegarder\n");
		expect(response.headers.get('X-Translation-Failures')).toBeNull();
	});

	it('leaves quotes that belong to the string alone', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: 'Il a dit "bonjour" {0}' });

		const response = await runWith(mockRun, "greeting=He said \"hello\" {0}\n", 'llama-3.1-8b');

		expect(await response.text()).toBe("greeting=Il a dit \"bonjour\" {0}\n");
	});
});

// Batching is where the cost saving lives: the system prompt is several times the
// size of a typical entry, so sending it once per entry dominates the bill.
describe('batched translation', () => {
	function runBatched(mockRun: ReturnType<typeof vi.fn>, content: string) {
		const mockEnv = { ...env, AI: { run: mockRun } } as unknown as Env;
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm(content, 'fr', 'llama-3.1-8b')
		});
		const ctx = createExecutionContext();
		return worker.fetch(request, mockEnv, ctx).then(async (response) => {
			await waitOnExecutionContext(ctx);
			return response;
		});
	}

	const THREE = "a=One\nb=Two\nc=Three\n";

	it('translates several entries in a single call', async () => {
		const mockRun = vi.fn().mockResolvedValue({ response: '1. Un\n2. Deux\n3. Trois' });

		const response = await runBatched(mockRun, THREE);

		expect(await response.text()).toBe("a=Un\nb=Deux\nc=Trois\n");
		expect(mockRun).toHaveBeenCalledTimes(1);
		expect(mockRun.mock.calls[0][1].messages[1].content).toBe('1. One\n2. Two\n3. Three');
	});

	it('maps translations by the number the model returned, not by position', async () => {
		// A model that drops line 2 must not shift line 3 up into its place.
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ response: '1. Un\n3. Trois' })
			.mockResolvedValue({ response: 'Deux' });

		const response = await runBatched(mockRun, THREE);

		expect(await response.text()).toBe("a=Un\nb=Deux\nc=Trois\n");
		// Only the missing entry is retried, not the whole batch.
		expect(mockRun).toHaveBeenCalledTimes(2);
	});

	it('retries entries individually when the batch reply is unusable', async () => {
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ response: 'I am afraid I cannot help with that.' })
			.mockResolvedValue({ response: 'Traduit' });

		const response = await runBatched(mockRun, THREE);

		// Batch discarded, three singles: never a worse translation, only an extra call.
		expect(await response.text()).toBe("a=Traduit\nb=Traduit\nc=Traduit\n");
		expect(mockRun).toHaveBeenCalledTimes(4);
	});

	it('falls back to singles when the batch call throws', async () => {
		const mockRun = vi.fn()
			.mockRejectedValueOnce(new Error('AI service blip'))
			.mockResolvedValue({ response: 'Traduit' });

		const response = await runBatched(mockRun, THREE);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("a=Traduit\nb=Traduit\nc=Traduit\n");
		expect(response.headers.get('X-Translation-Failures')).toBeNull();
	});

	it('still reports 500 when every entry fails at the API', async () => {
		const mockRun = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

		const response = await runBatched(mockRun, THREE);

		expect(response.status).toBe(500);
	});

	it('applies placeholder verification to batched results', async () => {
		// The guard must not be reachable only through the single-entry path.
		const mockRun = vi.fn()
			.mockResolvedValueOnce({ response: '1. Bonjour {0} et {0}' })
			.mockResolvedValue({ response: 'Bonjour {0} et {0}' });

		const response = await runBatched(mockRun, "greeting=Hello {0}\n");

		expect(await response.text()).toBe("greeting=Hello {0}\n");
		expect(response.headers.get('X-Translation-Failures')).toBe('1');
	});

	it('does not batch a seq2seq model, which cannot be told about several strings', async () => {
		const mockRun = vi.fn().mockResolvedValue({ translated_text: 'Traduit' });
		const mockEnv = { ...env, AI: { run: mockRun } } as unknown as Env;
		const request = new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm(THREE, 'fr', 'm2m100')
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(mockRun).toHaveBeenCalledTimes(3);
		expect(mockRun.mock.calls[0][1].text).toBe('One');
	});
});

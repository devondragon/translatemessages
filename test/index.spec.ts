// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, runInDurableObject, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker, { type Env, type DailySpendCounter, SPEND_COUNTER_NAME, secondsUntilUtcMidnight } from '../src/index';

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

// Burst protection for the public endpoint. The binding is optional: a deployment
// without it does no limiting, which is what the single-user personal instance wants.
describe('rate limiting', () => {
	function limiterEnv(limit: ReturnType<typeof vi.fn>, aiRun?: ReturnType<typeof vi.fn>) {
		return {
			...env,
			AI: { run: aiRun ?? vi.fn().mockResolvedValue({ response: '1. Bonjour' }) },
			RATE_LIMITER: { limit }
		} as unknown as Env;
	}

	function translateRequest(ip = '203.0.113.7') {
		return new IncomingRequest('http://example.com', {
			method: 'POST',
			body: buildForm("greeting=Hello\n", 'fr'),
			headers: { 'CF-Connecting-IP': ip, Origin: 'https://translatemessages.pages.dev' }
		});
	}

	async function send(request: Request, mockEnv: Env) {
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);
		return response;
	}

	it('rejects with 429 once the limit is exceeded', async () => {
		const limit = vi.fn().mockResolvedValue({ success: false });
		const aiRun = vi.fn();

		const response = await send(translateRequest(), limiterEnv(limit, aiRun));

		expect(response.status).toBe(429);
		expect(response.headers.get('Retry-After')).toBe('60');
		// No AI call: the point is to not spend the budget on a refused request.
		expect(aiRun).not.toHaveBeenCalled();
	});

	it('keeps CORS headers on the 429', async () => {
		const limit = vi.fn().mockResolvedValue({ success: false });

		const response = await send(translateRequest(), limiterEnv(limit));

		// Asserted together: a 200 carries the same header, so checking the header
		// alone would pass even if the limiter were bypassed entirely.
		expect(response.status).toBe(429);
		// Without these the browser discards the body and the frontend shows a generic
		// network error instead of "you are being rate limited".
		expect(response.headers.get('Access-Control-Allow-Origin'))
			.toBe('https://translatemessages.pages.dev');
		expect(await response.text()).toContain('Too many requests');
	});

	it('buckets by client IP', async () => {
		const limit = vi.fn().mockResolvedValue({ success: true });

		await send(translateRequest('198.51.100.4'), limiterEnv(limit));

		expect(limit).toHaveBeenCalledWith({ key: '198.51.100.4' });
	});

	it('lets the request through when under the limit', async () => {
		const limit = vi.fn().mockResolvedValue({ success: true });

		const response = await send(translateRequest(), limiterEnv(limit));

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("greeting=Bonjour\n");
	});

	it('does not limit preflight requests', async () => {
		const limit = vi.fn().mockResolvedValue({ success: false });
		const request = new IncomingRequest('http://example.com', {
			method: 'OPTIONS',
			headers: { Origin: 'https://translatemessages.pages.dev', 'CF-Connecting-IP': '203.0.113.7' }
		});

		const response = await send(request, limiterEnv(limit));

		// Limiting the preflight would surface as a CORS failure rather than the 429
		// the user should actually see.
		expect(response.status).toBe(204);
		expect(limit).not.toHaveBeenCalled();
	});

	it('fails open when the limiter itself errors', async () => {
		const limit = vi.fn().mockRejectedValue(new Error('limiter unavailable'));

		const response = await send(translateRequest(), limiterEnv(limit));

		// A broken limiter is not a reason to refuse translations.
		expect(response.status).toBe(200);
	});

	it('does no limiting when no limiter is bound', async () => {
		const mockEnv = {
			...env,
			AI: { run: vi.fn().mockResolvedValue({ response: '1. Bonjour' }) }
		} as unknown as Env;

		const response = await send(translateRequest(), mockEnv);

		expect(response.status).toBe(200);
	});
});

// A global daily ceiling on entries sent to the model. Distinct from the burst
// limiter above: that one bounds requests per minute per IP, this one bounds the
// day's spend for the whole deployment. Both bindings are optional, and the
// personal instance binds neither.
describe('daily spend cap', () => {
	const SPEND_COUNTER = env.DAILY_SPEND as DurableObjectNamespace<DailySpendCounter>;

	function counter() {
		return SPEND_COUNTER.get(SPEND_COUNTER.idFromName(SPEND_COUNTER_NAME));
	}

	// One object serves the whole deployment, so it also serves every test in this
	// file. Without the reset each test inherits the previous one's spend and the
	// order of the file silently decides which assertions hold.
	beforeEach(async () => {
		await runInDurableObject(counter(), (_instance, state) => state.storage.deleteAll());
	});

	// Uses the bound counter rather than a stub: the arithmetic the cap depends on
	// is the behaviour under test, so mocking it would test the mock.
	function cappedEnv(budget: string, aiRun?: ReturnType<typeof vi.fn>) {
		return {
			...env,
			AI: { run: aiRun ?? vi.fn().mockResolvedValue({ response: '1. Bonjour\n2. Au revoir\n3. Merci' }) },
			DAILY_ENTRY_BUDGET: budget
		} as unknown as Env;
	}

	function translateRequest(body: FormData) {
		return new IncomingRequest('http://example.com', {
			method: 'POST',
			body,
			headers: { Origin: 'https://translatemessages.pages.dev' }
		});
	}

	async function send(request: Request, mockEnv: Env) {
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, mockEnv, ctx);
		await waitOnExecutionContext(ctx);
		return response;
	}

	function today() {
		return new Date().toISOString().slice(0, 10);
	}

	it('lets a request through when the day has budget left', async () => {
		const response = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), cappedEnv('10'));

		expect(response.status).toBe(200);
		expect(await response.text()).toBe('greeting=Bonjour\n');
	});

	it('refuses once the budget is spent, without calling the model', async () => {
		const aiRun = vi.fn();
		await counter().charge(today(), 10);

		const response = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), cappedEnv('10', aiRun));

		expect(response.status).toBe(503);
		// The entire point of the cap is not spending, so a refusal that still called
		// the model would be worthless.
		expect(aiRun).not.toHaveBeenCalled();
	});

	it('names the daily cap in the refusal and points Retry-After at UTC midnight', async () => {
		await counter().charge(today(), 10);

		const response = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), cappedEnv('10'));

		const body = await response.text();
		// The burst limiter says "wait a minute and try again"; repeating that here
		// would tell the user something untrue for the rest of the day.
		expect(body).toContain('daily translation budget');
		expect(body).not.toContain('wait a minute');
		const retryAfter = Number(response.headers.get('Retry-After'));
		expect(retryAfter).toBeGreaterThan(0);
		expect(retryAfter).toBeLessThanOrEqual(86400);
	});

	it('keeps CORS headers on the refusal', async () => {
		await counter().charge(today(), 10);

		const response = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), cappedEnv('10'));

		// Asserted together: a 200 carries the same header, so checking the header
		// alone would pass even with the cap bypassed entirely.
		expect(response.status).toBe(503);
		expect(response.headers.get('Access-Control-Allow-Origin'))
			.toBe('https://translatemessages.pages.dev');
	});

	it('charges the entries translated, not one per request', async () => {
		const file = 'one=Hello\ntwo=Goodbye\nthree=Thanks\n';

		const first = await send(translateRequest(buildForm(file, 'fr')), cappedEnv('3'));
		const second = await send(translateRequest(buildForm(file, 'fr')), cappedEnv('3'));

		// Three entries exhaust a budget of three. Charging one per request would
		// leave room here and let the same file through twice more.
		expect(first.status).toBe(200);
		expect(second.status).toBe(503);
		expect(await counter().spent(today())).toBe(3);
	});

	it('does not charge a request rejected before translation', async () => {
		const rejected = await send(translateRequest(buildForm('greeting=Hello\n', 'klingon')), cappedEnv('1'));

		expect(rejected.status).toBe(400);
		// A validation failure spends nothing, so it must not consume the budget the
		// next caller needs.
		expect(await counter().spent(today())).toBe(0);
		const accepted = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), cappedEnv('1'));
		expect(accepted.status).toBe(200);
	});

	it('does not charge a request where every call to the model threw', async () => {
		const aiRun = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

		const response = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), cappedEnv('10', aiRun));

		expect(response.status).toBe(500);
		// Nothing was spent, and charging anyway would let an outage exhaust the day --
		// leaving users refused after the model came back.
		expect(await counter().spent(today())).toBe(0);
	});

	it('starts from zero when the UTC date rolls over', async () => {
		const stub = counter();
		await stub.charge('2026-07-27', 5);

		expect(await stub.spent('2026-07-27')).toBe(5);
		// Cloudflare's Neuron allocation resets at 00:00 UTC. A counter that carried
		// yesterday's total forward would refuse a day that has its budget back.
		expect(await stub.spent('2026-07-28')).toBe(0);

		await stub.charge('2026-07-28', 2);
		expect(await stub.spent('2026-07-28')).toBe(2);
		expect(await stub.spent('2026-07-27')).toBe(0);
	});

	it('fails open when the counter errors', async () => {
		const brokenEnv = {
			...env,
			AI: { run: vi.fn().mockResolvedValue({ response: '1. Bonjour' }) },
			DAILY_ENTRY_BUDGET: '10',
			DAILY_SPEND: {
				idFromName: () => 'id',
				get: () => ({
					spent: () => Promise.reject(new Error('counter unavailable')),
					charge: () => Promise.reject(new Error('counter unavailable'))
				})
			}
		} as unknown as Env;

		const response = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), brokenEnv);

		// A broken counter is not a reason to refuse translations, exactly as for the
		// burst limiter.
		expect(response.status).toBe(200);
	});

	it('does no capping when no counter is bound', async () => {
		const uncappedEnv = {
			...env,
			AI: { run: vi.fn().mockResolvedValue({ response: '1. Bonjour' }) },
			DAILY_ENTRY_BUDGET: '0',
			DAILY_SPEND: undefined
		} as unknown as Env;

		// The personal instance binds no counter; a budget var left behind must not
		// start capping it.
		const response = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), uncappedEnv);

		expect(response.status).toBe(200);
	});

	it('does no capping when no budget is configured', async () => {
		const uncappedEnv = {
			...env,
			AI: { run: vi.fn().mockResolvedValue({ response: '1. Bonjour' }) }
		} as unknown as Env;
		await counter().charge(today(), 1000);

		const response = await send(translateRequest(buildForm('greeting=Hello\n', 'fr')), uncappedEnv);

		expect(response.status).toBe(200);
	});

	it('does not cap preflight requests', async () => {
		const spent = vi.fn();
		const stubbedEnv = {
			...env,
			DAILY_ENTRY_BUDGET: '0',
			DAILY_SPEND: { idFromName: () => 'id', get: () => ({ spent, charge: vi.fn() }) }
		} as unknown as Env;
		const request = new IncomingRequest('http://example.com', {
			method: 'OPTIONS',
			headers: { Origin: 'https://translatemessages.pages.dev' }
		});

		const response = await send(request, stubbedEnv);

		// Capping the preflight would surface as a CORS failure rather than the 503
		// the user should actually see.
		expect(response.status).toBe(204);
		expect(spent).not.toHaveBeenCalled();
	});
});

describe('secondsUntilUtcMidnight', () => {
	it('counts a full day at midnight', () => {
		expect(secondsUntilUtcMidnight(new Date('2026-07-27T00:00:00Z'))).toBe(86400);
	});

	it('counts the remainder late in the day', () => {
		expect(secondsUntilUtcMidnight(new Date('2026-07-27T23:59:30Z'))).toBe(30);
	});

	it('never reports zero, so Retry-After always names a future moment', () => {
		expect(secondsUntilUtcMidnight(new Date('2026-07-27T23:59:59.500Z'))).toBeGreaterThan(0);
	});
});

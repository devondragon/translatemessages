// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker, { type Env } from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

function buildForm(content: string, language: string): FormData {
	const formData = new FormData();
	formData.append('file', new File([content], 'messages.properties', { type: 'text/plain' }));
	formData.append('language', language);
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
			body: buildForm("greeting=Hello\n", 'fr')
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
			body: buildForm("greeting=Hello\nfarewell=Goodbye\n", 'fr')
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
			body: buildForm("# just a comment\n", 'fr')
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
			body: buildForm(fileContent, 'fr')
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
			body: buildForm("greeting=Hello {0} there\n", 'fr')
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
			body: buildForm("named=Hi {0}\n", 'fr')
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
			body: buildForm(fileContent, 'fr')
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
			body: buildForm("named=Hi {0}\n", 'fr')
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
			body: buildForm(`many=${values}\n`, 'fr')
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
			body: buildForm(fileContent, 'fr')
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
			body: buildForm("greeting=Hello\n", 'fr'),
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
			body: buildForm("greeting=Hello\n", 'invalid-lang'),
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

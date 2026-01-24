// test/parsing.spec.ts
import { describe, it, expect } from 'vitest';
import {
	buildEntries,
	unescapePropertiesText,
	escapePropertiesText,
	maskPlaceholders,
	restorePlaceholders,
	parseFirstLine,
	parseContinuationLine,
	lineHasContinuation,
	SUPPORTED_LANGUAGES,
	type PlaceholderToken
} from '../src/index';

describe('buildEntries', () => {
	it('groups single-line entries', () => {
		const lines = ['key1=value1', 'key2=value2'];
		const entries = buildEntries(lines);
		expect(entries).toEqual([
			{ indexes: [0] },
			{ indexes: [1] }
		]);
	});

	it('groups multi-line entries with continuations', () => {
		const lines = ['key=value \\', '  continued', 'key2=value2'];
		const entries = buildEntries(lines);
		expect(entries).toEqual([
			{ indexes: [0, 1] },
			{ indexes: [2] }
		]);
	});

	it('treats comments as single entries', () => {
		const lines = ['# comment', '! another comment', 'key=value'];
		const entries = buildEntries(lines);
		expect(entries).toEqual([
			{ indexes: [0] },
			{ indexes: [1] },
			{ indexes: [2] }
		]);
	});

	it('treats empty lines as single entries', () => {
		const lines = ['key1=value1', '', 'key2=value2'];
		const entries = buildEntries(lines);
		expect(entries).toEqual([
			{ indexes: [0] },
			{ indexes: [1] },
			{ indexes: [2] }
		]);
	});

	it('handles files with only comments', () => {
		const lines = ['# comment 1', '# comment 2', '! comment 3'];
		const entries = buildEntries(lines);
		expect(entries).toEqual([
			{ indexes: [0] },
			{ indexes: [1] },
			{ indexes: [2] }
		]);
	});

	it('handles empty files', () => {
		const lines: string[] = [];
		const entries = buildEntries(lines);
		expect(entries).toEqual([]);
	});

	it('handles triple continuation', () => {
		const lines = ['key=line1 \\', '  line2 \\', '  line3 \\', '  line4'];
		const entries = buildEntries(lines);
		expect(entries).toEqual([
			{ indexes: [0, 1, 2, 3] }
		]);
	});
});

describe('lineHasContinuation', () => {
	it('detects single trailing backslash', () => {
		expect(lineHasContinuation('value \\')).toBe(true);
	});

	it('ignores double backslash (escaped)', () => {
		expect(lineHasContinuation('value \\\\')).toBe(false);
	});

	it('detects continuation with trailing whitespace', () => {
		expect(lineHasContinuation('value \\  ')).toBe(true);
	});

	it('returns false for no backslash', () => {
		expect(lineHasContinuation('value')).toBe(false);
	});

	it('handles triple backslash as continuation', () => {
		expect(lineHasContinuation('value \\\\\\')).toBe(true);
	});
});

describe('parseFirstLine', () => {
	it('parses equals separator', () => {
		const result = parseFirstLine('key=value');
		expect(result).toEqual({
			prefix: 'key=',
			value: 'value',
			suffix: ''
		});
	});

	it('parses colon separator', () => {
		const result = parseFirstLine('key:value');
		expect(result).toEqual({
			prefix: 'key:',
			value: 'value',
			suffix: ''
		});
	});

	it('parses whitespace separator', () => {
		const result = parseFirstLine('key value');
		expect(result).toEqual({
			prefix: 'key ',
			value: 'value',
			suffix: ''
		});
	});

	it('handles leading whitespace in key', () => {
		const result = parseFirstLine('  key=value');
		expect(result).toEqual({
			prefix: '  key=',
			value: 'value',
			suffix: ''
		});
	});

	it('handles whitespace after separator', () => {
		const result = parseFirstLine('key=  value');
		expect(result).toEqual({
			prefix: 'key=  ',
			value: 'value',
			suffix: ''
		});
	});

	it('returns null for lines without separator', () => {
		const result = parseFirstLine('noseparator');
		expect(result).toBeNull();
	});

	it('handles escaped separator in key', () => {
		const result = parseFirstLine('key\\=name=value');
		expect(result).toEqual({
			prefix: 'key\\=name=',
			value: 'value',
			suffix: ''
		});
	});

	it('preserves continuation suffix', () => {
		const result = parseFirstLine('key=value \\');
		expect(result).toEqual({
			prefix: 'key=',
			value: 'value ',
			suffix: '\\'
		});
	});
});

describe('parseContinuationLine', () => {
	it('parses continuation with leading whitespace', () => {
		const result = parseContinuationLine('  continued');
		expect(result).toEqual({
			prefix: '  ',
			value: 'continued',
			suffix: ''
		});
	});

	it('parses continuation with tab', () => {
		const result = parseContinuationLine('\tcontinued');
		expect(result).toEqual({
			prefix: '\t',
			value: 'continued',
			suffix: ''
		});
	});

	it('preserves continuation marker', () => {
		const result = parseContinuationLine('  continued \\');
		expect(result).toEqual({
			prefix: '  ',
			value: 'continued ',
			suffix: '\\'
		});
	});
});

describe('unescapePropertiesText', () => {
	it('unescapes tab', () => {
		expect(unescapePropertiesText('hello\\tworld')).toBe('hello\tworld');
	});

	it('unescapes newline', () => {
		expect(unescapePropertiesText('hello\\nworld')).toBe('hello\nworld');
	});

	it('unescapes carriage return', () => {
		expect(unescapePropertiesText('hello\\rworld')).toBe('hello\rworld');
	});

	it('unescapes form feed', () => {
		expect(unescapePropertiesText('hello\\fworld')).toBe('hello\fworld');
	});

	it('unescapes unicode', () => {
		expect(unescapePropertiesText('caf\\u00e9')).toBe('café');
	});

	it('unescapes backslash', () => {
		expect(unescapePropertiesText('back\\\\slash')).toBe('back\\slash');
	});

	it('unescapes special characters', () => {
		expect(unescapePropertiesText('hello\\=world')).toBe('hello=world');
		expect(unescapePropertiesText('hello\\:world')).toBe('hello:world');
		expect(unescapePropertiesText('hello\\#world')).toBe('hello#world');
		expect(unescapePropertiesText('hello\\!world')).toBe('hello!world');
	});

	it('handles malformed unicode (too short)', () => {
		expect(unescapePropertiesText('\\u12')).toBe('\\u12');
	});

	it('handles malformed unicode (invalid chars)', () => {
		expect(unescapePropertiesText('\\uXYZW')).toBe('\\uXYZW');
	});

	it('handles trailing backslash', () => {
		expect(unescapePropertiesText('value\\')).toBe('value\\');
	});

	it('handles empty string', () => {
		expect(unescapePropertiesText('')).toBe('');
	});
});

describe('escapePropertiesText', () => {
	it('escapes tab', () => {
		expect(escapePropertiesText('hello\tworld')).toBe('hello\\tworld');
	});

	it('escapes newline', () => {
		expect(escapePropertiesText('hello\nworld')).toBe('hello\\nworld');
	});

	it('escapes carriage return', () => {
		expect(escapePropertiesText('hello\rworld')).toBe('hello\\rworld');
	});

	it('escapes form feed', () => {
		expect(escapePropertiesText('hello\fworld')).toBe('hello\\fworld');
	});

	it('escapes backslash', () => {
		expect(escapePropertiesText('back\\slash')).toBe('back\\\\slash');
	});

	it('escapes special characters', () => {
		expect(escapePropertiesText('key=value')).toBe('key\\=value');
		expect(escapePropertiesText('key:value')).toBe('key\\:value');
		expect(escapePropertiesText('key#value')).toBe('key\\#value');
		expect(escapePropertiesText('key!value')).toBe('key\\!value');
	});

	it('escapes non-ASCII characters to unicode', () => {
		expect(escapePropertiesText('café')).toBe('caf\\u00e9');
	});

	it('escapes control characters to unicode', () => {
		expect(escapePropertiesText('bell\x07')).toBe('bell\\u0007');
	});

	it('handles empty string', () => {
		expect(escapePropertiesText('')).toBe('');
	});

	it('round-trips with unescape', () => {
		const original = 'Hello World! café\ttab\nnewline';
		const escaped = escapePropertiesText(original);
		const unescaped = unescapePropertiesText(escaped);
		expect(unescaped).toBe(original);
	});
});

describe('maskPlaceholders', () => {
	it('masks simple numbered placeholders', () => {
		const counter = { current: 0 };
		const result = maskPlaceholders('Hello {0}!', counter);
		expect(result.text).toBe('Hello __PH_0__!');
		expect(result.tokens).toEqual([{ marker: '__PH_0__', original: '{0}' }]);
	});

	it('masks multiple placeholders', () => {
		const counter = { current: 0 };
		const result = maskPlaceholders('{0} and {1}', counter);
		expect(result.text).toBe('__PH_0__ and __PH_1__');
		expect(result.tokens).toHaveLength(2);
	});

	it('masks Spring-style placeholders', () => {
		const counter = { current: 0 };
		const result = maskPlaceholders('Hello ${user.name}!', counter);
		expect(result.text).toBe('Hello __PH_0__!');
		expect(result.tokens[0].original).toBe('${user.name}');
	});

	it('masks printf-style placeholders', () => {
		const counter = { current: 0 };
		const result = maskPlaceholders('Value: %s', counter);
		expect(result.text).toBe('Value: __PH_0__');
		expect(result.tokens[0].original).toBe('%s');
	});

	it('handles numbered printf placeholders', () => {
		const counter = { current: 0 };
		const result = maskPlaceholders('%1$s %2$d', counter);
		expect(result.tokens).toHaveLength(2);
	});

	it('preserves counter across calls', () => {
		const counter = { current: 5 };
		const result = maskPlaceholders('{0}', counter);
		expect(result.tokens[0].marker).toBe('__PH_5__');
		expect(counter.current).toBe(6);
	});

	it('handles text without placeholders', () => {
		const counter = { current: 0 };
		const result = maskPlaceholders('Hello World!', counter);
		expect(result.text).toBe('Hello World!');
		expect(result.tokens).toEqual([]);
	});
});

describe('restorePlaceholders', () => {
	it('restores simple placeholder', () => {
		const tokens: PlaceholderToken[] = [{ marker: '__PH_0__', original: '{0}' }];
		const result = restorePlaceholders('Bonjour __PH_0__!', tokens);
		expect(result).toBe('Bonjour {0}!');
	});

	it('restores multiple placeholders', () => {
		const tokens: PlaceholderToken[] = [
			{ marker: '__PH_0__', original: '{0}' },
			{ marker: '__PH_1__', original: '{1}' }
		];
		const result = restorePlaceholders('__PH_0__ et __PH_1__', tokens);
		expect(result).toBe('{0} et {1}');
	});

	it('handles missing markers gracefully', () => {
		const tokens: PlaceholderToken[] = [{ marker: '__PH_0__', original: '{0}' }];
		const result = restorePlaceholders('No markers here', tokens);
		expect(result).toBe('No markers here');
	});

	it('handles empty tokens array', () => {
		const result = restorePlaceholders('Hello World', []);
		expect(result).toBe('Hello World');
	});
});

describe('SUPPORTED_LANGUAGES', () => {
	it('includes common languages', () => {
		expect(SUPPORTED_LANGUAGES).toContain('en');
		expect(SUPPORTED_LANGUAGES).toContain('fr');
		expect(SUPPORTED_LANGUAGES).toContain('es');
		expect(SUPPORTED_LANGUAGES).toContain('de');
		expect(SUPPORTED_LANGUAGES).toContain('zh');
		expect(SUPPORTED_LANGUAGES).toContain('ja');
	});

	it('does not include dialect codes', () => {
		expect(SUPPORTED_LANGUAGES).not.toContain('pt-BR');
		expect(SUPPORTED_LANGUAGES).not.toContain('zh-TW');
		expect(SUPPORTED_LANGUAGES).not.toContain('en-US');
	});

	it('has no duplicates', () => {
		const uniqueLanguages = new Set(SUPPORTED_LANGUAGES);
		expect(uniqueLanguages.size).toBe(SUPPORTED_LANGUAGES.length);
	});
});

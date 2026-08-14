import { describe, it, expect } from 'vitest';
import { decodeJWT, getTokenMaxAge, cn, splitByParent } from './utils';

describe('decodeJWT', () => {
	it('decodes a valid JWT token', () => {
		const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
		const payload = btoa(
			JSON.stringify({
				iat: 1000,
				nbf: 1000,
				exp: 2000,
				iss: 'surrealdb',
				NS: 'main',
				DB: 'test',
				ID: 'user:test'
			})
		);
		const token = `${header}.${payload}.signature`;
		const decoded = decodeJWT(token);

		expect(decoded.iat).toBe(1000);
		expect(decoded.exp).toBe(2000);
		expect(decoded.NS).toBe('main');
		expect(decoded.DB).toBe('test');
		expect(decoded.ID).toBe('user:test');
	});

	it('handles missing optional fields', () => {
		const header = btoa(JSON.stringify({ alg: 'HS256' }));
		const payload = btoa(JSON.stringify({ iat: 100, exp: 200 }));
		const token = `${header}.${payload}.sig`;
		const decoded = decodeJWT(token);

		expect(decoded.iat).toBe(100);
		expect(decoded.exp).toBe(200);
		expect(decoded.NS).toBeUndefined();
		expect(decoded.DB).toBeUndefined();
		expect(decoded.ID).toBeUndefined();
	});
});

describe('getTokenMaxAge', () => {
	it('returns remaining seconds until expiry', () => {
		const futureExp = Math.floor(Date.now() / 1000) + 600; // 10 min from now
		const token = {
			iat: 1000,
			nbf: 1000,
			exp: futureExp,
			iss: 'surrealdb'
		};
		const maxAge = getTokenMaxAge(token);
		expect(maxAge).toBeGreaterThan(500);
		expect(maxAge).toBeLessThanOrEqual(600);
	});

	it('returns 0 for expired tokens', () => {
		const pastExp = Math.floor(Date.now() / 1000) - 100;
		const token = {
			iat: 1000,
			nbf: 1000,
			exp: pastExp,
			iss: 'surrealdb'
		};
		const maxAge = getTokenMaxAge(token);
		expect(maxAge).toBe(0);
	});

	it('returns 15 min fallback for non-finite exp', () => {
		const token = {
			iat: 1000,
			nbf: 1000,
			exp: NaN,
			iss: 'surrealdb'
		};
		const maxAge = getTokenMaxAge(token);
		expect(maxAge).toBe(900);
	});

	it('accepts a raw token string', () => {
		const futureExp = Math.floor(Date.now() / 1000) + 300;
		const header = btoa(JSON.stringify({ alg: 'HS256' }));
		const payload = btoa(JSON.stringify({ exp: futureExp }));
		const token = `${header}.${payload}.sig`;
		const maxAge = getTokenMaxAge(token);
		expect(maxAge).toBeGreaterThan(200);
		expect(maxAge).toBeLessThanOrEqual(300);
	});
});

describe('cn', () => {
	it('merges class names', () => {
		const result = cn('foo', 'bar');
		expect(result).toBe('foo bar');
	});

	it('deduplicates conflicting tailwind classes', () => {
		const result = cn('px-2', 'px-4');
		expect(result).toBe('px-4');
	});

	it('handles falsy values', () => {
		const result = cn('foo', false, null, undefined, 'bar');
		expect(result).toContain('foo');
		expect(result).toContain('bar');
	});
});

describe('splitByParent', () => {
	it('groups nodes by type', () => {
		const nodes = [
			{ id: '1', type: 'board', position: { x: 0, y: 0 }, data: {} },
			{ id: '2', type: 'breaker', position: { x: 0, y: 0 }, data: {} },
			{ id: '3', type: 'board', position: { x: 0, y: 0 }, data: {} }
		];
		const result = splitByParent(nodes as any);
		expect(Object.keys(result)).toHaveLength(2);
		expect(result['board']).toHaveLength(2);
		expect(result['breaker']).toHaveLength(1);
	});

	it('skips nodes without type', () => {
		const nodes = [
			{ id: '1', type: 'board', position: { x: 0, y: 0 }, data: {} },
			{ id: '2', position: { x: 0, y: 0 }, data: {} } // no type
		];
		const result = splitByParent(nodes as any);
		expect(Object.keys(result)).toHaveLength(1);
		expect(result['board']).toHaveLength(1);
	});

	it('returns empty object for empty input', () => {
		const result = splitByParent([]);
		expect(Object.keys(result)).toHaveLength(0);
	});
});

import { describe, expect, it } from 'vitest';
import {
	EmbeddingVectorSchema,
	LocalPointSchema,
	SearchPointCreateSchema,
	SEARCH_POINT_EMBEDDING_DIMENSION,
	buildSearchPointText
} from './search-points';

describe('search point contracts', () => {
	it('accepts finite local point coordinates', () => {
		expect(
			LocalPointSchema.safeParse({ type: 'Point', coordinates: [12.5, -8] }).success
		).toBe(true);
		expect(
			LocalPointSchema.safeParse({ type: 'Point', coordinates: [Infinity, 0] }).success
		).toBe(false);
	});

	it('requires a non-empty bounded description and finite coordinates', () => {
		expect(
			SearchPointCreateSchema.safeParse({ description: 'Broken light', x: 1, y: 2 }).success
		).toBe(true);
		expect(
			SearchPointCreateSchema.safeParse({ description: ' ', x: 1, y: 2 }).success
		).toBe(false);
		expect(
			SearchPointCreateSchema.safeParse({ description: 'Broken light', x: NaN, y: 2 }).success
		).toBe(false);
	});

	it('builds deterministic searchable text from optional context', () => {
		expect(
			buildSearchPointText('Broken light', {
				level: 'Floor 2',
				zone: 'Food Court',
				area: 'Entrance'
			})
		).toBe('Broken light\nLevel: Floor 2\nZone: Food Court\nNearby area: Entrance');
	});

	it('requires the configured embedding dimension', () => {
		expect(EmbeddingVectorSchema.safeParse(new Array(SEARCH_POINT_EMBEDDING_DIMENSION).fill(0)).success).toBe(
			true
		);
		expect(EmbeddingVectorSchema.safeParse(new Array(383).fill(0)).success).toBe(false);
	});
});

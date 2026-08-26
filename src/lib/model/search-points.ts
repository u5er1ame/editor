import z from 'zod/v4';

/** Initial embedding size used by the local search-point dataset. */
export const SEARCH_POINT_EMBEDDING_DIMENSION = 384;

export const LocalPointSchema = z.object({
	type: z.literal('Point'),
	coordinates: z.tuple([z.number().finite(), z.number().finite()])
});

export type LocalPoint = z.infer<typeof LocalPointSchema>;

export const SearchPointSchema = z.object({
	id: z.string(),
	description: z.string().min(1),
	photo: z.string().optional().nullable(),
	x: z.number().finite(),
	y: z.number().finite(),
	zone_id: z.string().optional().nullable()
});

export type SearchPoint = z.infer<typeof SearchPointSchema>;

export const SearchPointSearchSchema = z.object({
	query_text: z.string().trim().max(10_000).optional(),
	limit: z.number().int().min(1).max(100).default(10),
	threshold: z.number().min(-1).max(1).default(0.3)
});

export type SearchPointSearch = z.infer<typeof SearchPointSearchSchema>;

export const SearchPointCreateSchema = z.object({
	description: z.string().trim().min(1, 'Description is required').max(10_000),
	x: z.number().finite(),
	y: z.number().finite(),
	zone_id: z.string().trim().min(1).optional()
});

export type SearchPointCreate = z.infer<typeof SearchPointCreateSchema>;

export const EmbeddingVectorSchema = z
	.array(z.number().finite())
	.length(SEARCH_POINT_EMBEDDING_DIMENSION);

/** Fields used by older seed rows before modality-specific vectors existed. */
export const LEGACY_EMBEDDING_FIELDS = ['embedding', 'embeding'] as const;

export function buildSearchPointText(
	description: string,
	context: { level?: string; zone?: string; area?: string } = {}
): string {
	const lines = [description.trim()];
	if (context.level) lines.push(`Level: ${context.level}`);
	if (context.zone) lines.push(`Zone: ${context.zone}`);
	if (context.area) lines.push(`Nearby area: ${context.area}`);
	return lines.join('\n');
}

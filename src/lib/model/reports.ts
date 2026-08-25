import z from 'zod/v4';
import { RecordId, BoundQuery } from 'surrealdb';

// ── Report Schemas ──────────────────────────────────────────────────

export const ReportStatus = z.enum(['open', 'in_progress', 'resolved']);
export type ReportStatus = z.infer<typeof ReportStatus>;

export const ReportSchema = z.object({
	id: z.custom<RecordId<'reports'>>().readonly(),
	description: z.string().min(1),
	bucket_key: z.string().optional(), // Reference to SurrealDB bucket
	content_type: z.string().optional(),
	status: ReportStatus.default('open'),
	created_at: z.string().optional(), // ISO date string
	created_by: z.string().optional(),
	resolved_at: z.string().optional(),
	resolved_by: z.string().optional()
});

export type Report = z.infer<typeof ReportSchema>;

// ── Report-Location Relation ────────────────────────────────────────

export const ReportLocationSchema = z.object({
	id: z.custom<RecordId<'report_locations'>>().readonly(),
	in: z.custom<RecordId<'reports'>>(),
	out: z.custom<RecordId<'levels' | 'electric_rooms' | 'boards' | 'breakers' | 'area_name'>>(),
	confidence: z.number().min(0).max(1).optional() // AI confidence score
});

export type ReportLocation = z.infer<typeof ReportLocationSchema>;

// ── Embedding Schema ────────────────────────────────────────────────

export const EmbeddingSchema = z.object({
	id: z.custom<RecordId<'embeddings'>>().readonly(),
	source_table: z.string(),
	source_id: z.string(),
	vector: z.array(z.number()),
	text_content: z.string(),
	created_at: z.string().optional()
});

export type Embedding = z.infer<typeof EmbeddingSchema>;

// ── Alias Schema (for typo tolerance) ───────────────────────────────

export const AliasSchema = z.object({
	id: z.custom<RecordId<'aliases'>>().readonly(),
	canonical: z.string(), // Canonical name
	alias: z.string(), // Alias/typo/translation
	language: z.enum(['en', 'ru', 'mixed']).optional()
});

export type Alias = z.infer<typeof AliasSchema>;

// ── Queries ─────────────────────────────────────────────────────────

export const ReportQuery = new BoundQuery(
	`SELECT *, 
		->report_locations->(levels, electric_rooms, boards, breakers, area_name) as locations
	FROM reports 
	ORDER BY created_at DESC`
);

export const ReportByIdQuery = new BoundQuery(
	`SELECT *, 
		->report_locations->(levels, electric_rooms, boards, breakers, area_name) as locations
	FROM $id`
);

export const EmbeddingQuery = new BoundQuery(
	`SELECT * FROM embeddings WHERE source_table = $table AND source_id = $id`
);

export const AliasQuery = new BoundQuery(
	`SELECT * FROM aliases WHERE canonical = $name OR alias = $name`
);

// ── Search Types ────────────────────────────────────────────────────

export interface SearchResult {
	/** Matched record */
	record: any;
	/** Similarity score (0-1) */
	score: number;
	/** Match type: 'vector' | 'text' | 'alias' */
	matchType: 'vector' | 'text' | 'alias';
	/** Location path (Level > Room > Board > Breaker) */
	locationPath?: string;
}

export interface SearchOptions {
	/** Search query text */
	query: string;
	/** Optional image for multimodal search */
	image?: string;
	/** Maximum results */
	limit?: number;
	/** Minimum similarity threshold */
	threshold?: number;
	/** Tables to search in */
	tables?: string[];
}

// ── Table Registration ──────────────────────────────────────────────

export const REPORT_TABLES = ['reports', 'report_locations', 'embeddings', 'aliases'] as const;
export type ReportTables = (typeof REPORT_TABLES)[number];

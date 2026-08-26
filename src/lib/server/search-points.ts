import { RecordId, type Surreal } from 'surrealdb';
import { Buffer } from 'node:buffer';
import { embeddingClient } from '$lib/server/embedding';
import {
	EmbeddingVectorSchema,
	SearchPointCreateSchema,
	SearchPointSearchSchema,
	SEARCH_POINT_EMBEDDING_DIMENSION,
	LEGACY_EMBEDDING_FIELDS,
	buildSearchPointText,
	type SearchPointCreate,
	type SearchPointSearch
} from '$lib/model/search-points';
import { generateFileKey } from '$lib/server/bucket';

const SEARCH_POINT_BUCKET = 'report_images';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export type SearchPointContext = {
	level?: string;
	zone?: string;
	area?: string;
};

export type SearchPointImage = {
	data: ArrayBuffer;
	contentType: string;
	name: string;
};

export type SearchPointSearchResult = {
	point: ReturnType<typeof toSearchPointDto>;
	score: number;
	matchedBy: 'text' | 'image';
};

export async function createSearchPoint(
	db: Surreal,
	input: SearchPointCreate,
	image?: SearchPointImage,
	context: SearchPointContext = {},
	username = 'unknown'
) {
	const parsed = SearchPointCreateSchema.safeParse(input);
	if (!parsed.success) throw new Error(parsed.error.message);
	if (image) validateImage(image);

	const description = parsed.data.description;
	const text = buildSearchPointText(description, context);
	const textEmbedding = await embeddingClient.embedText(text);
	EmbeddingVectorSchema.parse(textEmbedding);

	let imageEmbedding: number[] | undefined;
	let bucketKey: string | undefined;

	try {
		if (image) {
			const imageBase64 = arrayBufferToDataUrl(image.data, image.contentType);
			imageEmbedding = await embeddingClient.embedImage(imageBase64);
			EmbeddingVectorSchema.parse(imageEmbedding);
			bucketKey = generateFileKey('search-points', extensionFor(image.contentType, image.name));
			await uploadBucketObject(db, SEARCH_POINT_BUCKET, bucketKey, image.data, image.contentType);
		}

		const [created] = await db.query<any[]>(
			`CREATE embeddings SET
				description = $description,
				photo = $photo,
				x = $x,
				y = $y,
				zone_id = $zone_id,
				created_by = $created_by,
				created_at = time::now(),
				text_embedding = $text_embedding,
				image_embedding = $image_embedding,
				vector = $vector,
				text_content = $text_content`,
			{
				description,
				photo: bucketKey ?? null,
				x: parsed.data.x,
				y: parsed.data.y,
				zone_id: parsed.data.zone_id ? toRecordId(parsed.data.zone_id) : null,
				created_by: username,
				text_embedding: textEmbedding,
				image_embedding: imageEmbedding ?? null,
				// Compatibility with the original prototype shape.
				vector: textEmbedding,
				text_content: text
			}
		);

		if (!created) throw new Error('Failed to create search point');
		return toSearchPointDto(created);
	} catch (cause) {
		if (bucketKey) {
			try {
				await db.query('REMOVE $bucket->$key', { bucket: SEARCH_POINT_BUCKET, key: bucketKey });
			} catch (cleanupError) {
				console.warn('Failed to clean up search point image:', cleanupError);
			}
		}
		throw cause;
	}
}

export async function searchSearchPoints(
	db: Surreal,
	input: SearchPointSearch,
	image?: SearchPointImage
): Promise<SearchPointSearchResult[]> {
	const parsed = SearchPointSearchSchema.safeParse(input);
	if (!parsed.success) throw new Error(parsed.error.message);
	if (!parsed.data.query_text?.trim() && !image) {
		throw new Error('Text or image query is required');
	}
	if (image) validateImage(image);

	const vectors: Array<{ vector: number[]; matchedBy: 'text' | 'image' }> = [];
	if (parsed.data.query_text?.trim()) {
		vectors.push({
			vector: await embeddingClient.embedText(parsed.data.query_text),
			matchedBy: 'text'
		});
	}
	if (image) {
		vectors.push({
			vector: await embeddingClient.embedImage(
				arrayBufferToDataUrl(image.data, image.contentType)
			),
			matchedBy: 'image'
		});
	}
	vectors.forEach(({ vector }) => EmbeddingVectorSchema.parse(vector));

	const merged = new Map<string, SearchPointSearchResult>();
	for (const { vector, matchedBy } of vectors) {
		const fields = [matchedBy === 'text' ? 'text_embedding' : 'image_embedding', 'vector', ...LEGACY_EMBEDDING_FIELDS];
		for (const field of fields) {
			const [rows] = await db.query<any[]>(
				`SELECT id, description, photo, x, y, zone_id,
					vector::similarity::cosine($query_vector, ${field}) AS score
				 FROM embeddings
				 WHERE ${field} != NONE
					AND vector::similarity::cosine($query_vector, ${field}) >= $threshold
				 ORDER BY score DESC
				 LIMIT $limit`,
				{ query_vector: vector, threshold: parsed.data.threshold, limit: parsed.data.limit }
			);

			for (const row of rows ?? []) {
				const point = toSearchPointDto(row);
				if (!point.id || !Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
				const existing = merged.get(point.id);
				if (!existing || row.score > existing.score) {
					merged.set(point.id, { point, score: row.score, matchedBy });
				}
			}
		}
	}

	return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, parsed.data.limit);
}

export function toSearchPointDto(record: any) {
	return {
		id: record.id?.toString() ?? '',
		description: String(record.description ?? record.text_content ?? ''),
		photo: record.photo ?? null,
		x: Number(record.x),
		y: Number(record.y),
		zone_id: record.zone_id?.toString?.() ?? record.zone_id ?? null
	};
}

export async function uploadBucketObject(
	db: Surreal,
	bucket: string,
	key: string,
	data: ArrayBuffer,
	contentType: string
) {
	await db.query(
		`PUT $bucket->$key CONTENT {
			data: $data,
			content_type: $contentType,
			uploaded_at: time::now()
		}`,
		{
			bucket,
			key,
			data: Array.from(new Uint8Array(data)),
			contentType
		}
	);
}

export function validateImage(image: SearchPointImage) {
	if (!ALLOWED_IMAGE_TYPES.has(image.contentType)) {
		throw new Error('Only JPEG, PNG, WebP, and GIF images are supported');
	}
	if (image.data.byteLength === 0 || image.data.byteLength > MAX_IMAGE_BYTES) {
		throw new Error('Image must be between 1 byte and 10 MB');
	}
}

function toRecordId(value: string) {
	const [table, id] = value.split(':', 2);
	if (table !== 'zones' || !id) throw new Error(`Invalid semantic zone record id: ${value}`);
	return new RecordId(table, id);
}

function extensionFor(contentType: string, fileName: string) {
	const fromType = contentType.split('/')[1];
	if (fromType === 'jpeg') return 'jpg';
	if (fromType && /^[a-z0-9]+$/i.test(fromType)) return fromType;
	const fromName = fileName.split('.').pop()?.toLowerCase();
	return fromName && /^[a-z0-9]+$/.test(fromName) ? fromName : 'bin';
}

function arrayBufferToDataUrl(data: ArrayBuffer, contentType: string) {
	return `data:${contentType};base64,${Buffer.from(data).toString('base64')}`;
}

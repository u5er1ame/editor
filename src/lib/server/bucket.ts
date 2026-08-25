import { getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import z from 'zod/v4';

// ── Types ───────────────────────────────────────────────────────────

export interface BucketFile {
	/** File key in bucket */
	key: string;
	/** File size in bytes */
	size: number;
	/** Content type */
	type: string;
	/** Last modified timestamp */
	lastModified: Date;
}

export interface UploadOptions {
	/** Bucket name */
	bucket?: string;
	/** Content type */
	contentType?: string;
	/** Custom metadata */
	metadata?: Record<string, string>;
}

// ── Constants ───────────────────────────────────────────────────────

const DEFAULT_BUCKET = 'report_images';

// ── Bucket Operations ───────────────────────────────────────────────

/**
 * Upload a file to SurrealDB bucket
 */
export const uploadToBucket = query(
	z.object({
		bucket: z.string().optional(),
		key: z.string(),
		data: z.instanceof(ArrayBuffer),
		contentType: z.string().optional()
	}),
	async ({ bucket = DEFAULT_BUCKET, key, data, contentType }) => {
		const { locals } = getRequestEvent();
		const db = locals.db.instance;

		if (!db.isConnected) {
			return error(500, 'DB not connected');
		}

		await db.ready;

		try {
			// Use SurrealDB bucket API
			// Note: This uses the raw query approach since SDK bucket API may vary
			const [result] = await db.query<[any]>(
				`PUT $bucket->$key CONTENT {
					data: $data,
					content_type: $contentType,
					uploaded_at: time::now()
				}`,
				{
					bucket,
					key,
					data: Array.from(new Uint8Array(data)),
					contentType: contentType || 'application/octet-stream'
				}
			);

			return { success: true, key, bucket };
		} catch (e: any) {
			console.error('Bucket upload failed:', e);
			return error(500, `Upload failed: ${e.message}`);
		}
	}
);

/**
 * Download a file from SurrealDB bucket
 */
export const downloadFromBucket = query(
	z.object({
		bucket: z.string().optional(),
		key: z.string()
	}),
	async ({ bucket = DEFAULT_BUCKET, key }) => {
		const { locals } = getRequestEvent();
		const db = locals.db.instance;

		if (!db.isConnected) {
			return error(500, 'DB not connected');
		}

		await db.ready;

		try {
			const [result] = await db.query<[any]>(
				`SELECT * FROM $bucket->$key`,
				{ bucket, key }
			);

			if (!result) {
				return error(404, 'File not found');
			}

			return {
				data: new Uint8Array(result.data).buffer,
				contentType: result.content_type,
				uploadedAt: result.uploaded_at
			};
		} catch (e: any) {
			console.error('Bucket download failed:', e);
			return error(500, `Download failed: ${e.message}`);
		}
	}
);

/**
 * List files in a bucket
 */
export const listBucketFiles = query(
	z.object({
		bucket: z.string().optional(),
		prefix: z.string().optional()
	}),
	async ({ bucket = DEFAULT_BUCKET, prefix }) => {
		const { locals } = getRequestEvent();
		const db = locals.db.instance;

		if (!db.isConnected) {
			return error(500, 'DB not connected');
		}

		await db.ready;

		try {
			const [result] = await db.query<[BucketFile[]]>(
				`SELECT key, size, type, uploaded_at as lastModified 
				 FROM $bucket 
				 WHERE key CONTAINS $prefix
				 ORDER BY uploaded_at DESC`,
				{ bucket, prefix: prefix || '' }
			);

			return result || [];
		} catch (e: any) {
			console.error('Bucket list failed:', e);
			return error(500, `List failed: ${e.message}`);
		}
	}
);

/**
 * Delete a file from bucket
 */
export const deleteFromBucket = query(
	z.object({
		bucket: z.string().optional(),
		key: z.string()
	}),
	async ({ bucket = DEFAULT_BUCKET, key }) => {
		const { locals } = getRequestEvent();
		const db = locals.db.instance;

		if (!db.isConnected) {
			return error(500, 'DB not connected');
		}

		await db.ready;

		try {
			await db.query(
				`REMOVE $bucket->$key`,
				{ bucket, key }
			);

			return { success: true, key, bucket };
		} catch (e: any) {
			console.error('Bucket delete failed:', e);
			return error(500, `Delete failed: ${e.message}`);
		}
	}
);

// ── Helper Functions ────────────────────────────────────────────────

/**
 * Generate a unique file key for uploads
 */
export function generateFileKey(prefix: string, extension: string): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 8);
	return `${prefix}/${timestamp}_${random}.${extension}`;
}

/**
 * Convert File to ArrayBuffer for upload
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
	return file.arrayBuffer();
}

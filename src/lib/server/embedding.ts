import { env } from '$env/dynamic/private';
import z from 'zod/v4';
import { SEARCH_POINT_EMBEDDING_DIMENSION } from '$lib/model/search-points';

// ── Types ───────────────────────────────────────────────────────────

export interface EmbeddingRequest {
	/** Text to embed */
	input?: string | string[];
	/** Image URL or base64 to embed */
	image?: string | string[];
	/** Model to use (defaults to jina-embeddings-v5-omni) */
	model?: string;
}

export interface EmbeddingResponse {
	/** The embedding vectors */
	data: Array<{
		/** The embedding vector */
		embedding: number[];
		/** The index of the embedding */
		index: number;
	}>;
	/** The model used */
	model: string;
	/** Usage statistics */
	usage: {
		/** Total tokens */
		total_tokens: number;
	};
}

// ── Validation ──────────────────────────────────────────────────────

const EmbeddingDataSchema = z.object({
	embedding: z.array(z.number()),
	index: z.number()
});

const EmbeddingResponseSchema = z.object({
	data: z.array(EmbeddingDataSchema),
	model: z.string(),
	usage: z.object({
		total_tokens: z.number()
	})
});

// ── Client ──────────────────────────────────────────────────────────

export class EmbeddingClient {
	private baseUrl: string;
	private model: string;

	constructor() {
		this.baseUrl = env.EMBEDDING_URL || 'http://localhost:1234/v1/embeddings';
		this.model = 'jina-embeddings-v5-omni';
	}

	/**
	 * Generate embeddings for text and/or images
	 * Uses OpenAI-compatible API via LM Studio
	 */
	async embed(request: EmbeddingRequest): Promise<number[][]> {
		const body: Record<string, any> = {
			model: request.model || this.model
		};

		// Handle text input
		if (request.input) {
			body.input = request.input;
		}

		// Handle image input (Jina supports images in same space)
		if (request.image) {
			body.image = request.image;
		}

		const response = await fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Embedding failed: ${response.status} - ${error}`);
		}

		const raw = await response.json();
		const result = EmbeddingResponseSchema.safeParse(raw);

		if (!result.success) {
			throw new Error(`Invalid embedding response: ${result.error.message}`);
		}

		// Return vectors sorted by index
		return result.data.data
			.sort((a, b) => a.index - b.index)
			.map((d) => d.embedding);
	}

	/**
	 * Embed a single text string
	 * Returns the first embedding vector
	 */
	async embedText(text: string): Promise<number[]> {
		const vectors = await this.embed({ input: text });
		return this.requireVector(vectors[0]);
	}

	/**
	 * Embed multiple text strings (batch)
	 * Returns array of embedding vectors
	 */
	async embedTexts(texts: string[]): Promise<number[][]> {
		return this.embed({ input: texts });
	}

	/**
	 * Embed an image (URL or base64)
	 * Returns the embedding vector
	 */
	async embedImage(image: string): Promise<number[]> {
		const vectors = await this.embed({ image });
		return this.requireVector(vectors[0]);
	}

	/**
	 * Embed both text and image together
	 * Jina v5 Omni puts them in the same vector space
	 */
	async embedMultimodal(text: string, image: string): Promise<number[]> {
		const vectors = await this.embed({ input: text, image });
		return this.requireVector(vectors[0]);
	}

	private requireVector(vector: number[] | undefined): number[] {
		if (!vector) throw new Error('Embedding service returned no vector');
		if (vector.length !== SEARCH_POINT_EMBEDDING_DIMENSION) {
			throw new Error(
				`Expected ${SEARCH_POINT_EMBEDDING_DIMENSION}-dimensional embedding, received ${vector.length}`
			);
		}
		return vector;
	}

	/**
	 * Check if the embedding service is available
	 */
	async healthCheck(): Promise<boolean> {
		try {
			await this.embedText('test');
			return true;
		} catch {
			return false;
		}
	}
}

// ── Singleton ───────────────────────────────────────────────────────

export const embeddingClient = new EmbeddingClient();

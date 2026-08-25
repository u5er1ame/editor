import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ locals }) => {
	const results: any = {
		timestamp: new Date().toISOString(),
		services: {}
	};

	// Check SurrealDB
	try {
		const db = locals.db.instance;
		if (db.isConnected) {
			await db.use({ database: locals.db.database	});
			const [info] = await db.query<any[]>('INFO FOR DB STRUCTURE');
			results.services.surrealdb = {
				status: 'connected',
				url: env.SURREAL_URL,
				tables: info?.tables?.length || 0
			};
		} else {
			results.services.surrealdb = {
				status: 'disconnected',
				url: env.SURREAL_URL
			};
		}
	} catch (e: any) {
		results.services.surrealdb = {
			status: 'error',
			error: e.message
		};
	}

	// Check Embedding Service
	try {
		const embeddingUrl = env.EMBEDDING_URL || 'http://localhost:1234/v1/embeddings';
		const response = await fetch(embeddingUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'jina-embeddings-v5-omni',
				input: 'health check'
			})
		});

		if (response.ok) {
			const data = await response.json();
			results.services.embedding = {
				status: 'connected',
				url: embeddingUrl,
				model: data.model,
				dimension: data.data?.[0]?.embedding?.length || 0
			};
		} else {
			results.services.embedding = {
				status: 'error',
				url: embeddingUrl,
				httpStatus: response.status
			};
		}
	} catch (e: any) {
		results.services.embedding = {
			status: 'error',
			url: env.EMBEDDING_URL,
			error: e.message
		};
	}

	// Check Node-RED
	try {
		const noderedUrl = env.NODERED_URL || 'http://localhost:1883';
		const response = await fetch(`${noderedUrl}/diagnostics`, {
			signal: AbortSignal.timeout(2000)
		});

		if (response.ok) {
			const data = await response.json();
			results.services.nodered = {
				status: 'connected',
				url: noderedUrl,
				version: data.runtime?.version
			};
		} else {
			results.services.nodered = {
				status: 'error',
				url: noderedUrl,
				httpStatus: response.status
			};
		}
	} catch (e: any) {
		results.services.nodered = {
			status: 'unavailable',
			url: env.NODERED_URL,
			error: e.message
		};
	}

	// Overall status
	const allConnected = Object.values(results.services).every(
		(s: any) => s.status === 'connected'
	);
	results.status = allConnected ? 'healthy' : 'degraded';

	return json(results, {
		status: allConnected ? 200 : 503
	});
};

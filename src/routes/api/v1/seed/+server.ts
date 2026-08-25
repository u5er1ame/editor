import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Surreal, RecordId } from 'surrealdb';
import { env } from '$env/dynamic/private';

// ── Mock Data ───────────────────────────────────────────────────────

const MOCK_REPORTS = [
	{
		description: 'Светильник не работает на 2 этаже у Макдоналдс',
		description_en: 'Light not working on 2nd floor near McDonalds',
		status: 'open',
		location: 'electric_rooms:er_2f_north'
	},
	{
		description: 'Перегорела лампа в электрощитовой этажа 1',
		description_en: 'Burnt out lamp in electrical room floor 1',
		status: 'in_progress',
		location: 'electric_rooms:er_1f_main'
	},
	{
		description: 'Мигает свет в коридоре рядом с Зарой',
		description_en: 'Flickering light in corridor near Zara',
		status: 'open',
		location: 'area_name:area_west_wing'
	},
	{
		description: 'Сломан выключатель в подсобном помещении',
		description_en: 'Broken switch in utility room',
		status: 'resolved',
		location: 'electric_rooms:er_b1_storage'
	},
	{
		description: 'Не работает розетка у входа в Спортмастер',
		description_en: 'Outlet not working at Sportmaster entrance',
		status: 'open',
		location: 'boards:board_2f_west'
	},
	{
		description: 'Автомат выбивает при включении кондиционера',
		description_en: 'Breaker trips when AC is turned on',
		status: 'in_progress',
		location: 'breakers:breaker_3f_ac'
	},
	{
		description: 'Тусклый свет в примерочной H&M',
		description_en: 'Dim light in H&M fitting room',
		status: 'open',
		location: 'area_name:area_3f_hm'
	},
	{
		description: 'Повреждена проводка в техническом помещении',
		description_en: 'Damaged wiring in technical room',
		status: 'open',
		location: 'electric_rooms:er_b1_tech'
	},
	{
		description: 'Не горит аварийный выход на парковке',
		description_en: 'Emergency exit light not working on parking',
		status: 'in_progress',
		location: 'levels:level_p1'
	},
	{
		description: 'Короткое замыкание в щитке 3 этажа',
		description_en: 'Short circuit in 3rd floor panel',
		status: 'open',
		location: 'boards:board_3f_east'
	},
	{
		description: 'Светильник мигает в фудкорте',
		description_en: 'Light flickering in food court',
		status: 'open',
		location: 'area_name:area_2f_food'
	},
	{
		description: 'Не работает освещение в лифтовом холле',
		description_en: 'Elevator lobby lighting not working',
		status: 'open',
		location: 'electric_rooms:er_elevator'
	}
];

const MOCK_ALIASES = [
	{ canonical: 'Макдоналдс', alias: 'Макдак', language: 'ru' },
	{ canonical: 'Макдоналдс', alias: 'McDonalds', language: 'en' },
	{ canonical: 'Макдоналдс', alias: 'МакДоналдс', language: 'ru' },
	{ canonical: 'Зара', alias: 'Zara', language: 'en' },
	{ canonical: 'Зара', alias: 'ЗАРА', language: 'ru' },
	{ canonical: 'H&M', alias: 'ЭйчЭндМ', language: 'ru' },
	{ canonical: 'H&M', alias: 'H M', language: 'en' },
	{ canonical: 'Спортмастер', alias: 'Спорт-мастер', language: 'ru' },
	{ canonical: 'Спортмастер', alias: 'Sportmaster', language: 'en' },
	{ canonical: 'светильник', alias: 'лампа', language: 'ru' },
	{ canonical: 'светильник', alias: 'свет', language: 'ru' },
	{ canonical: 'светильник', alias: 'light', language: 'en' },
	{ canonical: 'автомат', alias: 'выключатель', language: 'ru' },
	{ canonical: 'автомат', alias: 'breaker', language: 'en' },
	{ canonical: 'щиток', alias: 'щит', language: 'ru' },
	{ canonical: 'щиток', alias: 'panel', language: 'en' },
	{ canonical: 'электрощитовая', alias: 'электро щитовая', language: 'ru' },
	{ canonical: 'электрощитовая', alias: 'electrical room', language: 'en' },
	{ canonical: 'розетка', alias: 'выход', language: 'ru' },
	{ canonical: 'розетка', alias: 'outlet', language: 'en' }
];

// ── Embedding Helper ────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
	const embeddingUrl = env.EMBEDDING_URL || 'http://localhost:1234/v1/embeddings';

	const response = await fetch(embeddingUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'jina-embeddings-v5-omni',
			input: text
		})
	});

	if (!response.ok) {
		throw new Error(`Embedding failed: ${response.status}`);
	}

	const data = await response.json();
	return data.data[0].embedding;
}

// ── Seed Endpoint ───────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, locals }) => {
	const { action } = await request.json();

	// Connect to SurrealDB
	const db = locals.db.instance;
	// await db.connect(env.SURREAL_URL, {
	// 	authentication: {
	// 		username: env.SURREAL_ROOT_VIEWER_USER || 'root',
	// 		password: env.SURREAL_ROOT_VIEWER_PASS || 'root'
	// 	}
	// });
	await db.use({ namespace: 'trc', database: 'electrical' });

	try {
		switch (action) {
			case 'check':
				return await checkServices(db);

			case 'seed-reports':
				return await seedReports(db);

			case 'seed-aliases':
				return await seedAliases(db);

			case 'seed-all':
				const aliasResult = await seedAliases(db);
				const reportResult = await seedReports(db);
				return json({
					aliases: aliasResult,
					reports: reportResult
				});

			case 'backfill-embeddings':
				return await backfillEmbeddings(db);

			default:
				return error(400, `Unknown action: ${action}`);
		}
	} catch (e: any) {
		console.error('Seed error:', e);
		return error(500, e.message);
	} finally {
		await db.close();
	}
};

// ── Check Services ──────────────────────────────────────────────────

async function checkServices(db: Surreal) {
	const results: any = {
		surrealdb: false,
		embedding: false,
		tables: {}
	};

	// Check SurrealDB
	try {
		await db.query('SELECT 1');
		results.surrealdb = true;
	} catch (e) {
		results.surrealdb_error = String(e);
	}

	// Check embedding service
	try {
		const embedding = await generateEmbedding('test');
		results.embedding = true;
		results.embedding_dimension = embedding.length;
	} catch (e) {
		results.embedding_error = String(e);
	}

	// Check tables
	try {
		const [tables] = await db.query<any[]>('INFO FOR DB STRUCTURE');
		if (tables?.tables) {
			for (const table of tables.tables) {
				results.tables[table.name] = {
					exists: true,
					kind: table.kind?.kind || 'NORMAL'
				};
			}
		}
	} catch (e) {
		results.tables_error = String(e);
	}

	return json(results);
}

// ── Seed Reports ────────────────────────────────────────────────────

async function seedReports(db: Surreal) {
	const results = {
		created: 0,
		embedded: 0,
		failed: 0,
		errors: [] as string[]
	};

	for (const report of MOCK_REPORTS) {
		try {
			// Create report
			const [created] = await db.query<any[]>(
				`CREATE reports SET
					description = $description,
					status = $status,
					created_at = time::now(),
					created_by = 'seed'`,
				{
					description: report.description,
					status: report.status
				}
			);

			if (!created) {
				results.errors.push(`Failed to create report: ${report.description}`);
				results.failed++;
				continue;
			}

			results.created++;

			// Link to location
			if (report.location) {
				const [table, id] = report.location.split(':');
				try {
					await db.query(
						`RELATE $report->report_locations->$location SET confidence = 1.0`,
						{
							report: created.id,
							location: new RecordId(table, id)
						}
					);
				} catch (e) {
					// Location might not exist, that's ok
					console.warn(`Location ${report.location} not found, skipping link`);
				}
			}

			// Generate embedding
			try {
				const vector = await generateEmbedding(report.description);
				await db.query(
					`CREATE embeddings SET
						source_table = 'reports',
						source_id = $source_id,
						vector = $vector,
						text_content = $text,
						created_at = time::now()`,
					{
						source_id: created.id.toString(),
						vector,
						text: report.description
					}
				);
				results.embedded++;
			} catch (e) {
				results.errors.push(`Embedding failed for: ${report.description}`);
				console.warn('Embedding failed:', e);
			}
		} catch (e: any) {
			results.errors.push(e.message);
			results.failed++;
		}
	}

	return json(results);
}

// ── Seed Aliases ────────────────────────────────────────────────────

async function seedAliases(db: Surreal) {
	const results = {
		created: 0,
		failed: 0,
		errors: [] as string[]
	};

	for (const alias of MOCK_ALIASES) {
		try {
			await db.query(
				`CREATE aliases SET
					canonical = $canonical,
					alias = $alias,
					language = $language`,
				alias
			);
			results.created++;
		} catch (e: any) {
			results.errors.push(e.message);
			results.failed++;
		}
	}

	return json(results);
}

// ── Backfill Embeddings ─────────────────────────────────────────────

async function backfillEmbeddings(db: Surreal) {
	const results = {
		processed: 0,
		failed: 0,
		errors: [] as string[]
	};

	// Find reports without embeddings
	const [reports] = await db.query<any[]>(
		`SELECT * FROM reports
		WHERE id NOT IN (SELECT source_id FROM embeddings WHERE source_table = 'reports')`
	);

	if (!reports || reports.length === 0) {
		return json({ ...results, message: 'No reports to backfill' });
	}

	for (const report of reports) {
		try {
			const vector = await generateEmbedding(report.description);
			await db.query(
				`CREATE embeddings SET
					source_table = 'reports',
					source_id = $source_id,
					vector = $vector,
					text_content = $text,
					created_at = time::now()`,
				{
					source_id: report.id.toString(),
					vector,
					text: report.description
				}
			);
			results.processed++;
		} catch (e: any) {
			results.errors.push(e.message);
			results.failed++;
		}
	}

	return json(results);
}

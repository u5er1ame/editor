/**
 * Quick test script to verify LM Studio + Jina embeddings
 * Run: node scripts/test-embedding.mjs
 */

const EMBEDDING_URL = 'http://localhost:1234/v1/embeddings';

async function testEmbedding() {
	console.log('🧪 Testing LM Studio + Jina Embeddings...\n');

	// Test 1: Basic embedding
	console.log('Test 1: Basic text embedding');
	try {
		const response = await fetch(EMBEDDING_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'jina-embeddings-v5-omni',
				input: 'Светильник не работает'
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}

		const data = await response.json();
		const embedding = data.data[0].embedding;

		console.log('✅ Success!');
		console.log(`   Model: ${data.model}`);
		console.log(`   Dimension: ${embedding.length}`);
		console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
		console.log(`   Tokens used: ${data.usage.total_tokens}\n`);
	} catch (e) {
		console.error('❌ Failed:', e.message, '\n');
		return;
	}

	// Test 2: Batch embedding
	console.log('Test 2: Batch embedding (3 texts)');
	try {
		const texts = [
			'Broken light on 2nd floor',
			'Сломан свет на 2 этаже',
			'Макдоналдс не работает освещение'
		];

		const response = await fetch(EMBEDDING_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'jina-embeddings-v5-omni',
				input: texts
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}

		const data = await response.json();

		console.log('✅ Success!');
		console.log(`   Embeddings generated: ${data.data.length}`);
		console.log(`   Tokens used: ${data.usage.total_tokens}\n`);

		// Test 3: Cross-lingual similarity
		console.log('Test 3: Cross-lingual similarity check');
		const enEmbedding = data.data[0].embedding;
		const ruEmbedding = data.data[1].embedding;

		// Cosine similarity
		const dotProduct = enEmbedding.reduce((sum, val, i) => sum + val * ruEmbedding[i], 0);
		const normA = Math.sqrt(enEmbedding.reduce((sum, val) => sum + val * val, 0));
		const normB = Math.sqrt(ruEmbedding.reduce((sum, val) => sum + val * val, 0));
		const similarity = dotProduct / (normA * normB);

		console.log(`   EN: "Broken light on 2nd floor"`);
		console.log(`   RU: "Сломан свет на 2 этаже"`);
		console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
		console.log(`   ${similarity > 0.7 ? '✅ Good cross-lingual match!' : '⚠️  Low similarity - check model'}\n`);
	} catch (e) {
		console.error('❌ Failed:', e.message, '\n');
	}

	console.log('🎉 All tests completed!');
	console.log('\nYou can now:');
	console.log('1. Run: npm run dev');
	console.log('2. Go to: http://localhost:5173/admin');
	console.log('3. Click "Seed All Data" to populate mock data');
	console.log('4. Go to: http://localhost:5173/search to test search');
}

testEmbedding().catch(console.error);

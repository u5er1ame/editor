# Database Initialization Scripts

## Quick Start

### 1. Initialize Schema

Run the schema initialization script in SurrealDB console:

```bash
# Connect to SurrealDB console
surreal sql --endpoint http://localhost:8008 --username root --password root --namespace trc --database electrical

# Run the initialization script
source scripts/init-schema.surql
```

Or via HTTP API:

```bash
curl -X POST http://localhost:8008/sql \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'root:root' | base64)" \
  -H "NS: trc" \
  -H "DB: electrical" \
  -d @scripts/init-schema.surql
```

### 2. Seed Mock Data

After starting the dev server, use the admin panel:

1. Go to `http://localhost:5173/admin`
2. Click "Seed All Data" to add mock reports with real embeddings
3. Click "Check Status" to verify all services are connected

Or use the API directly:

```bash
# Check services
curl http://localhost:5173/api/v1/health

# Seed all data
curl -X POST http://localhost:5173/api/v1/seed \
  -H "Content-Type: application/json" \
  -d '{"action": "seed-all"}'

# Seed only reports
curl -X POST http://localhost:5173/api/v1/seed \
  -H "Content-Type: application/json" \
  -d '{"action": "seed-reports"}'

# Seed only aliases
curl -X POST http://localhost:5173/api/v1/seed \
  -H "Content-Type: application/json" \
  -d '{"action": "seed-aliases"}'

# Backfill embeddings for existing reports
curl -X POST http://localhost:5173/api/v1/seed \
  -H "Content-Type: application/json" \
  -d '{"action": "backfill-embeddings"}'
```

### 3. Test Search

After seeding data, test the search:

```bash
# Search for broken lights
curl -X POST http://localhost:5173/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query_text": "сломан свет", "limit": 5}'

# Search in English
curl -X POST http://localhost:5173/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query_text": "broken light", "limit": 5}'

# Search with typo (alias matching)
curl -X POST http://localhost:5173/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query_text": "Макдак", "limit": 5}'
```

## Schema Overview

### Tables

| Table | Type | Description |
|-------|------|-------------|
| `reports` | SCHEMAFULL | Problem reports from field admins |
| `report_locations` | RELATION | Links reports to locations |
| `embeddings` | SCHEMAFULL | Vector embeddings for search |
| `aliases` | SCHEMAFULL | Typo tolerance & translations |

### Indexes

| Index | Table | Type | Purpose |
|-------|-------|------|---------|
| `mtvec` | embeddings | MTREE | Vector similarity search |
| `alias_lookup` | aliases | INDEX | Fast alias lookup |
| `canonical_lookup` | aliases | INDEX | Fast canonical name lookup |
| `report_text` | reports | BM25 | Full-text search |

### Buckets

| Bucket | Purpose |
|--------|---------|
| `report_images` | Store photos from field reports |

## Mock Data

The seed script creates:

- **12 reports** with realistic electrical problems in Russian
- **20 aliases** for brand names and technical terms (RU/EN)
- **Real embeddings** generated via LM Studio + Jina v5 Omni

### Example Reports

| Description | Status |
|-------------|--------|
| Светильник не работает на 2 этаже у Макдоналдс | open |
| Перегорела лампа в электрощитовой этажа 1 | in_progress |
| Мигает свет в коридоре рядом с Зарой | open |
| Сломан выключатель в подсобном помещении | resolved |
| Не работает розетка у входа в Спортмастер | open |
| Автомат выбивает при включении кондиционера | in_progress |

### Example Aliases

| Canonical | Alias | Language |
|-----------|-------|----------|
| Макдоналдс | Макдак | ru |
| Макдоналдс | McDonalds | en |
| Зара | Zara | en |
| H&M | ЭйчЭндМ | ru |
| светильник | лампа | ru |
| автомат | breaker | en |

## Troubleshooting

### Embedding Service Not Working

1. Check LM Studio is running on port 1234
2. Verify `jina-embeddings-v5-omni` model is loaded
3. Test the endpoint:
   ```bash
   curl http://localhost:1234/v1/embeddings \
     -H "Content-Type: application/json" \
     -d '{"model": "jina-embeddings-v5-omni", "input": "test"}'
   ```

### SurrealDB Connection Issues

1. Check SurrealDB is running on port 8008
2. Verify namespace and database exist:
   ```bash
   surreal sql --endpoint http://localhost:8008 --username root --password root
   > USE NS trc DB electrical;
   > INFO FOR DB STRUCTURE;
   ```

### Search Returns No Results

1. Check if embeddings exist:
   ```sql
   SELECT count() FROM embeddings;
   ```
2. Backfill embeddings if needed:
   ```bash
   curl -X POST http://localhost:5173/api/v1/seed \
     -H "Content-Type: application/json" \
     -d '{"action": "backfill-embeddings"}'
   ```
3. Lower the similarity threshold in search request

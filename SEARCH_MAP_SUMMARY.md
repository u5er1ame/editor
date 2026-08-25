# Search & Map Features Summary

## ✅ New Features Implemented

### 1. Search Page (`/search`)
- **Full-text search** with semantic, text, and alias matching
- **Report upload** dialog with image support
- **Recent reports** display
- **Example queries** for quick testing
- **Multilingual** support (RU/EN)

### 2. Report System
- **Create reports** with description and location
- **Image upload** with multimodal embedding
- **Status tracking** (open/in_progress/resolved)
- **Auto-embedding** generation on creation

### 3. Map View Updates
- **Real data loading** from SurrealDB
- **Fallback sample data** if no geometry exists
- **Geometry seeding** endpoint for mall layout

### 4. Admin Panel (`/admin`)
- **Health check** for all services
- **Database seeding** for reports and aliases
- **Geometry seeding** for map view
- **Quick links** to all views

---

## 📁 New Files Created

### Components
| File | Purpose |
|------|---------|
| `src/lib/components/ReportUpload.svelte` | Report creation dialog with image upload |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/health` | GET | Check all services status |
| `/api/v1/seed` | POST | Seed reports and aliases |
| `/api/v1/search` | POST | Vector + text + alias search |
| `/api/v1/reports` | GET/POST | List/create reports |
| `/api/v1/reports/upload` | POST | Upload image for report |
| `/api/v1/map` | GET | Get map data (real or sample) |
| `/api/v1/map/seed` | POST | Seed geometry data |

### Pages
| Route | Purpose |
|-------|---------|
| `/search` | Search interface with report upload |
| `/admin` | System admin panel |

---

## 🚀 Usage Guide

### 1. Initialize Database Schema
```sql
-- Run in SurrealDB console
USE NS trc DB electrical;
source scripts/init-schema.surql;
```

### 2. Seed All Data
Go to `http://localhost:5173/admin` and:
1. Click **"Seed All Data"** - Creates reports with embeddings
2. Click **"Seed Geometry Data"** - Creates map geometry

### 3. Test Search
Go to `http://localhost:5173/search` and try:
- `сломан свет` (broken light)
- `Макдак` (McDonalds slang)
- `автомат выбивает` (breaker trips)
- `broken light` (English)

### 4. Create Report
1. Click **"Upload Report"** button
2. Enter description in Russian or English
3. Optionally select location and upload photo
4. Click Save - embedding generated automatically

### 5. View Map
Go to `http://localhost:5173/map` to see:
- Floor plans with geometry
- Electrical rooms highlighted
- Cable connections between areas

---

## 🔍 Search Pipeline

```
User Query
    │
    ▼
┌─────────────────┐
│ Generate Embedding│ ← Jina v5 Omni via LM Studio
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vector Search    │ ← MTREE index in SurrealDB
│ (cosine similarity)│
└────────┬────────┘
         │
    ┌────┴────┐
    │ Results? │
    └────┬────┘
    Yes  │  No
    │    │
    ▼    ▼
┌────┐ ┌─────────┐
│Show│ │Text Search│ ← CONTAINS matching
└────┘ └────┬────┘
             │
        ┌────┴────┐
        │ Results? │
        └────┬────┘
        Yes  │  No
        │    │
        ▼    ▼
    ┌────┐ ┌─────────┐
    │Show│ │Alias Search│ ← Typo tolerance
    └────┘ └────┬────┘
                 │
                 ▼
             ┌────┐
             │Show│
             └────┘
```

---

## 🗺️ Map Data Structure

### Geometry Types
- **Levels**: Floor outlines (polygons)
- **Areas**: Zones within floors (polygons)
- **Rooms**: Electrical rooms (small polygons)
- **Connections**: Cables between rooms (linestrings)

### Coordinate System
- Simple Cartesian coordinates (not geographic)
- Origin at mall center
- Units in meters

### Sample Layout
```
        Floor 3 (y: 325-475)
    ┌─────────────────────────┐
    │  H&M Zone  │  Sport Zone │
    └─────────────────────────┘

        Floor 2 (y: 125-275)
    ┌─────────────────────────┐
    │  West Wing │  East Wing  │
    └─────────────────────────┘

        Floor 1 (y: -75 to 75)
    ┌─────────────────────────┐
    │ North Wing │ South Wing  │
    │     Food Court          │
    └─────────────────────────┘

        Parking (y: -175 to -100)
    ┌─────────────────────────┐
    │      Parking Area       │
    └─────────────────────────┘
```

---

## 🧪 Testing

### Test Embedding Service
```bash
node scripts/test-embedding.mjs
```

### Test Search API
```bash
# Semantic search
curl -X POST http://localhost:5173/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query_text": "сломан свет", "limit": 5}'

# Alias search (typo)
curl -X POST http://localhost:5173/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query_text": "Макдак", "limit": 5}'
```

### Test Reports API
```bash
# List reports
curl http://localhost:5173/api/v1/reports

# Create report
curl -X POST http://localhost:5173/api/v1/reports \
  -H "Content-Type: application/json" \
  -d '{"description": "Test report", "location_ids": ["levels:1f"]}'
```

---

## 📋 Next Steps

1. **Improve Search UI**
   - Add filters for status, date range
   - Add pagination
   - Show report details modal

2. **Enhance Map View**
   - Click report to highlight on map
   - Show reports as markers on map
   - Filter by floor/area

3. **Mobile Optimization**
   - Responsive search page
   - Touch-friendly map controls
   - Photo capture from camera

4. **Print Reports**
   - Generate PDF from search results
   - Include map screenshots
   - Circuit documentation format

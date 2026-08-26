-- =============================================
-- SurrealDB Schema Initialization
-- Run this in SurrealDB console or via API
-- =============================================

-- Use the correct namespace/database
USE NS trc DB electrical;

-- =============================================
-- BUCKETS (for file storage)
-- =============================================

DEFINE BUCKET report_images;

-- =============================================
-- TABLES (reports & search)
-- =============================================

-- Reports table
DEFINE TABLE reports SCHEMAFULL
  PERMISSIONS 
    FOR select WHERE true
    FOR create WHERE $auth.role IN ['owner', 'editor']
    FOR update WHERE $auth.role IN ['owner', 'editor']
    FOR delete WHERE $auth.role IN ['owner', 'editor'];

DEFINE FIELD description ON reports TYPE string;
DEFINE FIELD bucket_key ON reports TYPE option<string>;
DEFINE FIELD content_type ON reports TYPE option<string>;
DEFINE FIELD status ON reports TYPE string 
  ASSERT $value INSIDE ['open', 'in_progress', 'resolved'];
DEFINE FIELD created_at ON reports TYPE datetime 
  DEFAULT time::now();
DEFINE FIELD created_by ON reports TYPE option<string>;
DEFINE FIELD resolved_at ON reports TYPE option<datetime>;
DEFINE FIELD resolved_by ON reports TYPE option<string>;

-- Report-Location relation table
DEFINE TABLE report_locations SCHEMAFULL TYPE RELATION
  PERMISSIONS 
    FOR select WHERE true
    FOR create WHERE $auth.role IN ['owner', 'editor']
    FOR delete WHERE $auth.role IN ['owner', 'editor'];

DEFINE FIELD in ON report_locations TYPE record(reports);
DEFINE FIELD out ON report_locations TYPE record(levels | electric_rooms | boards | breakers | area_name);
DEFINE FIELD confidence ON report_locations TYPE option<float> 
  ASSERT $value >= 0.0 AND $value <= 1.0;

-- Searchable map points and their vector representations.
-- The existing embeddings table is kept as the physical table for the MVP.
DEFINE TABLE embeddings SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $auth.role IN ['owner', 'editor']
    FOR update WHERE $auth.role IN ['owner', 'editor']
    FOR delete WHERE $auth.role IN ['owner', 'editor'];

DEFINE FIELD description ON embeddings TYPE option<string>;
DEFINE FIELD photo ON embeddings TYPE option<string>;
DEFINE FIELD x ON embeddings TYPE option<float>;
DEFINE FIELD y ON embeddings TYPE option<float>;
DEFINE FIELD zone_id ON embeddings TYPE option<record<zones>>;
DEFINE FIELD created_by ON embeddings TYPE option<string>;
DEFINE FIELD created_at ON embeddings TYPE datetime
  DEFAULT time::now();
DEFINE FIELD text_embedding ON embeddings TYPE option<array<float>>;
DEFINE FIELD image_embedding ON embeddings TYPE option<array<float>>;

-- Legacy fields retained while existing report/search data is migrated.
DEFINE FIELD source_table ON embeddings TYPE option<string>;
DEFINE FIELD source_id ON embeddings TYPE option<string>;
DEFINE FIELD vector ON embeddings TYPE option<array<float>>;
DEFINE FIELD text_content ON embeddings TYPE option<string>;

-- The active local model is expected to return 384-dimensional vectors.
DEFINE INDEX embeddings_text_mtree ON embeddings FIELDS text_embedding
  MTREE DIMENSION 384 DIST COSINE;
DEFINE INDEX embeddings_image_mtree ON embeddings FIELDS image_embedding
  MTREE DIMENSION 384 DIST COSINE;

-- Aliases table (for typo tolerance)
DEFINE TABLE aliases SCHEMAFULL
  PERMISSIONS 
    FOR select WHERE true
    FOR create WHERE $auth.role IN ['owner', 'editor']
    FOR update WHERE $auth.role IN ['owner', 'editor']
    FOR delete WHERE $auth.role IN ['owner', 'editor'];

DEFINE FIELD canonical ON aliases TYPE string;
DEFINE FIELD alias ON aliases TYPE string;
DEFINE FIELD language ON aliases TYPE option<string>
  ASSERT $value INSIDE ['en', 'ru', 'mixed'];

-- Index for fast alias lookup
DEFINE INDEX alias_lookup ON aliases FIELDS alias;
DEFINE INDEX canonical_lookup ON aliases FIELDS canonical;

-- Semantic map zones are distinct from rentable areas and electrical rooms.
DEFINE TABLE zones SCHEMAFULL;
DEFINE FIELD name ON zones TYPE string;
DEFINE FIELD level_id ON zones TYPE record<levels>;
DEFINE FIELD geometry ON zones TYPE geometry<polygon>;
DEFINE FIELD parent_id ON zones TYPE option<record<zones>>;

-- =============================================
-- GEOMETRY FIELDS (for map view)
-- =============================================

-- Add geometry field to levels
DEFINE FIELD geometry ON levels TYPE option<geometry>;

-- Add geometry field to area_name
DEFINE FIELD geometry ON area_name TYPE option<geometry>;

-- Add geometry field to electric_rooms
DEFINE FIELD geometry ON electric_rooms TYPE option<geometry>;

-- =============================================
-- VIEWS (optional, for search)
-- =============================================

-- Full-text search index on reports
DEFINE ANALYZER report_analyzer TOKENIZERS blank, class FILTERS lowercase, edgengram(2, 10);
DEFINE INDEX report_text ON reports FIELDS description 
  SEARCH ANALYZER report_analyzer BM25;

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

-- Embeddings table (for vector search)
DEFINE TABLE embeddings SCHEMAFULL
  PERMISSIONS 
    FOR select WHERE true
    FOR create WHERE $auth.role IN ['owner', 'editor']
    FOR update WHERE $auth.role IN ['owner', 'editor']
    FOR delete WHERE $auth.role IN ['owner', 'editor'];

DEFINE FIELD source_table ON embeddings TYPE string;
DEFINE FIELD source_id ON embeddings TYPE string;
DEFINE FIELD vector ON embeddings TYPE array<float>;
DEFINE FIELD text_content ON embeddings TYPE string;
DEFINE FIELD created_at ON embeddings TYPE datetime 
  DEFAULT time::now();

-- MTREE index for vector similarity search
DEFINE INDEX mtvec ON embeddings FIELDS vector 
  MTREE DIMENSION 1024 DIST COSINE;

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

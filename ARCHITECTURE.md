# Mall Electrical Workspace Architecture

## Product boundary

This is an internal, domain-specific application for a mall electrical engineering team.

Primary workflows:

- View and print registered electrical data in the table workspace.
- Edit existing records inline or create records through a modal form.
- Explore and edit electrical-system relationships in the nested graph view.
- View and edit indoor floor-plan geometry in the map view.
- Create future map navigation markers with coordinates, images, and descriptions that can be embedded for text/image search.
- Inspect service availability from the admin view.

Reports are an indexing/search model, not a primary user workflow at this stage.

## Roles

SurrealDB remains the authority for the three supported roles:

- `VIEWER`: view, print, and search.
- `EDITOR`: viewer capabilities plus table, graph, and map editing.
- `OWNER`: editor capabilities plus owner-level database access already provided by SurrealDB.

The default viewer login is intentional for the internal deployment and remains unchanged for now. Client role checks are UX guards; server/database permissions remain the security boundary for mutations.

## Dependency direction

```text
SvelteKit routes / remote functions
  -> feature loaders and application use cases
    -> domain contracts and pure transformations
      -> infrastructure adapters (SurrealDB, embedding, bucket, Node-RED)

Feature UI -> shared UI and feature client state

Domain code must not import routes, browser rendering libraries, or Svelte components.
```

Remote functions are the preferred browser transport because they provide consistent SvelteKit error handling. REST endpoints remain available where a library or integration requires HTTP, such as a future SVAR REST data provider.

## Table extensibility rule

`src/lib/model/schemas.ts` contains the single `TABLE_DEFINITIONS` registry. A supported table is registered there with:

- database table name,
- display label,
- server/client validation schemas,
- query for fetched relations,
- coarse view capabilities.

Table columns, inline editors, graph node components, and map styling are feature-owned configuration. They must not be duplicated in a second table registration list.

Future improvement: split the definitions into one file per table while keeping one composed registry export. The composed registry remains the only public registration point.

## Feature ownership

### Tables

- `src/lib/components/NewTable.svelte` is the current table workspace.
- `src/lib/components/editor/Root.svelte` is the canonical modal editor for newly created records.
- Inline editors are for existing record edits.
- Table CRUD orchestration should progressively move into a table feature/application layer.

### Graph

- `src/lib/view/graph.svelte.ts` owns graph data transformations.
- `src/lib/components/Graph.svelte` owns XYFlow rendering and interaction.
- ELK layout runs in the browser through the graph route worker.
- Graph changes are intended to become editable and persist through shared database commands.

### Map

- Map coordinates are local indoor floor-plan x/y coordinates, not geographic coordinates.
- OpenLayers uses the registered `MALL_LOCAL_PROJECTION` identity projection.
- `EPSG:4326` must not be used because the coordinates are not longitude/latitude.
- `EPSG:3857` must not be used because Web Mercator would assign geographic meters and introduce unnecessary transformation semantics.
- Geometry editing is currently incomplete and will be rebuilt as explicit, testable operations: move, vertex edit, extrude, split, and draft draw.
- New navigation markers will be a separate persisted domain entity with required modal-form fields and optional image attachments.

### Search and embeddings

Search is currently secondary. It should consume map marker/location data and remain behind a shared embedding/search service when expanded. It must not become a second independent report implementation.

## Maintenance zones

Change carefully and keep stable:

- `src/lib/model/`
- `src/lib/app/`
- `src/lib/server/`
- `src/hooks.*`
- shared UI primitives
- transport contracts

## Feature implementation zones

New product behavior belongs primarily in:

- `src/lib/features/tables/`
- `src/lib/features/graph/`
- `src/lib/features/map/`
- `src/lib/features/search/`
- `src/lib/features/admin/`

The current files can migrate incrementally; route URLs and existing behavior should remain stable during the transition.

## Current migration order

1. Establish session and table registry boundaries.
2. Stabilize table CRUD and canonical editor behavior.
3. Extract graph commands and pure graph rules.
4. Rebuild map editing operations, starting with point editing and draft draw.
5. Add marker creation with bucket storage and embedding generation.
6. Consolidate search/report code after the marker data contract is stable.
7. Add integration/browser testing when the local service setup is ready.

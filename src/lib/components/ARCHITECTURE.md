# Cell and Inline Editor Architecture

## Overview

This module provides custom cell components and inline editors for the SVAR Grid component. It follows a modular architecture with separate directories for display cells and editable inline editors.

## Directory Structure

```
components/
├── cells/                    # Display-only cell components
│   ├── TextCell.svelte      # Default text display
│   ├── KeyCell.svelte       # Display value by key (e.g., row[key])
│   ├── SelectCell.svelte    # Display select values
│   ├── ComboCell.svelte     # Display combo values
│   ├── CheckboxCell.svelte  # Display checkbox values
│   └── index.ts             # Export all cell components
├── inline-editors/           # Editable inline editor components
│   ├── TextInlineEditor.svelte    # Text input editor
│   ├── SelectInlineEditor.svelte  # Select dropdown editor
│   ├── ComboInlineEditor.svelte   # Combo search editor
│   ├── CheckboxInlineEditor.svelte # Checkbox editor
│   ├── register.ts                # Register all editors with SVAR Grid
│   └── index.ts                   # Export all editor components
└── ARCHITECTURE.md           # This file
```

## Cell Components

Cell components are used to render values in the grid without editing capabilities. They receive `row` and `column` props from the Grid.

### Usage

```typescript
import { TextCell, KeyCell, SelectCell } from '$lib/components/cells';

// In column definition
const columns = [
  { id: 'name', cell: TextCell, width: 200 },
  { id: 'level', cell: KeyCell, props: { key: 'name' }, width: 150 },
];
```

## Inline Editor Components

Inline editors are registered with SVAR Grid and activated when users double-click cells. They receive `editor`, `onsave`, `oncancel`, and `onapply` props.

### Registration

```typescript
import { registerInlineEditors } from '$lib/components/inline-editors/register';

// Call once before Grid initialization
registerInlineEditors();
```

### Editor Props

- `editor.value` - Current cell value
- `editor.options` - Array of selectable options (for select/combo editors)
- `onsave()` - Confirm and close editor
- `oncancel()` - Discard changes and close
- `onapply(value)` - Update cell value without closing

## Integration with ColumnBuilder

The `ColumnBuilder` supports custom cell components via the `.cell()` method:

```typescript
import { ColumnBuilder } from '$lib/builders/column.svelte';
import { TextCell, KeyCell } from '$lib/components/cells';

// Simple text cell
const col1 = ColumnBuilder.withCell('name', TextCell).build();

// Key-based cell
const col2 = ColumnBuilder.withKeyCell('level', 'name', KeyCell).build();
```

## Modal vs Inline Editing

- **Existing items**: Use inline editors for quick in-place editing
- **New items**: Use the modal editor (`Root.svelte`) for complete form editing

This separation provides:
- Fast editing for existing records
- Comprehensive editing for new records with validation
- Consistent UX across the application

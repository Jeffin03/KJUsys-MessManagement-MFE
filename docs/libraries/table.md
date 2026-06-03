# Table Library

The Table Library (`lib-table`) is a comprehensive, feature-rich component designed for handling complex datasets with ease. It supports sorting, filtering, pagination, search, bulk actions, and export functionality out of the box.

## Technical Overview

The table component is located in the `@libs/table` package. It is built for high-performance and flexibility, supporting both client-side and server-side operations.

### Key Features
- **Client-side & Server-side Support**: Seamlessly switch between local data processing and API-driven operations.
- **Sorting**: Multi-column sorting with visual indicators.
- **Filtering**: Slide-in filter panel with support for text, dropdown, and multi-select filters.
- **Pagination**: Customizable pagination with items-per-page controls.
- **Search**: Integrated search bar with debounced input.
- **Actions**: Primary (View/Edit/Delete), secondary (custom icons), and bulk actions.
- **Export**: Integrated export menu for CSV, Excel, or custom formats.
- **Date Range**: Quick-select date ranges (1D, 1W, 1M, etc.) and custom date pickers.
- **Status Toggle**: Built-in status column with active/inactive toggles.

---

## API Reference

### Primary Inputs

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `columns` | `TableColumn[]` | `[]` | Column definitions (key, label, sortable, type). |
| `data` | `any[]` | `[]` | The array of row data to display. |
| `clientPagination`| `boolean` | `false` | If true, sorting, searching, and paging happen locally. |
| `loading` | `boolean` | `false` | Shows a skeleton loader when true. |
| `primaryActions` | `PrimaryAction[]` | `[]` | Defines View, Edit, and Delete buttons. |
| `secondaryActions`| `SecondaryAction[]`| `[]` | Defines custom SVG icon actions. |
| `bulkActions` | `PrimaryAction[]` | `[]` | Defines actions available when rows are selected. |
| `filters` | `FilterConfig[]` | `[]` | Configuration for the slide-in filter panel. |
| `pagination` | `PaginationConfig` | `...` | Current page state and total counts. |
| `exportOptions` | `ExportOption[]` | `[]` | Available export formats. |

### UI Feature Flags

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `showSearch` | `boolean` | `true` | Visibility of the search bar. |
| `showCheckboxes` | `boolean` | `false` | Enable multi-row selection. |
| `showStatusToggle`| `boolean` | `false` | Enable the status toggle column. |
| `showDateRange` | `boolean` | `false` | Visibility of quick date range links. |
| `stickyActions` | `boolean` | `true` | If true, the actions column stays fixed on the right. |

### Primary Outputs

| Property | Type | Description |
| :--- | :--- | :--- |
| `onPageChange` | `EventEmitter<number>` | Emitted when a new page is selected. |
| `onSearch` | `EventEmitter<string>` | Emitted when search text changes (if not client-side). |
| `onSort` | `EventEmitter<sortEvent>` | Emitted when a column header is clicked. |
| `onFilterApply` | `EventEmitter<Record>` | Emitted when "Apply Filters" is clicked. |
| `onExport` | `EventEmitter<string>` | Emitted when an export format is chosen. |
| `onBulkAction` | `EventEmitter<action>` | Emitted when a bulk action is triggered. |

---

## Data Models

### `TableColumn`
```typescript
interface TableColumn {
  key: string;      // Matching property in data objects
  label: string;    // Display title
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'status';
}
```

### `FilterConfig`
```typescript
interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'dropdown' | 'multiselect' | 'multidropdown' | 'checkbox';
  options?: { label: string; value: any }[];
  placeholder?: string;
}
```

---

## Usage Example

```html
<lib-table
  [columns]="myColumns"
  [data]="tableData"
  [primaryActions]="[{ type: 'edit' }, { type: 'delete' }]"
  [showCheckboxes]="true"
  (onEdit)="handleEdit($event)"
  (onPageChange)="fetchNewPage($event)">
</lib-table>
```

> [!TIP]
> Use `clientPagination="true"` for smaller datasets (under 1000 rows) to provide an instantaneous user experience without multiple API calls.

# `@libs/table` — Usage Guide

A fully-featured, reusable Angular 16 table component. Zero external CSS-framework dependency. All styles are self-contained and scoped with the `kjt-` prefix.

---

## 1. Setup

### Import in your module

```ts
import { TableModule } from '@libs/table';

@NgModule({
  imports: [TableModule]
})
export class YourModule {}
```

### Import types (TypeScript)

```ts
import {
  TableColumn,
  PrimaryAction,
  SecondaryAction,
  ExportOption,
  FilterConfig,
  PaginationConfig,
} from '@libs/table';
```

---

## 2. Selector

```html
<lib-table
  [columns]="columns"
  [data]="tableData"
  ...
></lib-table>
```

---

## 3. All `@Input()` Bindings

| Input | Type | Default | Description |
|---|---|---|---|
| `columns` | `TableColumn[]` | `[]` | Column definitions |
| `data` | `any[]` | `[]` | Row data |
| `primaryActions` | `PrimaryAction[]` | `[]` | Inline icon buttons: view / edit / delete |
| `secondaryActions` | `SecondaryAction[]` | `[]` | Custom actions in kebab (⋮) menu |
| `exportOptions` | `ExportOption[]` | `[]` | Single = plain btn; 2+ = floating menu |
| `filters` | `FilterConfig[]` | `[]` | Slide-in filter panel config |
| `pagination` | `PaginationConfig` | see below | Pagination state from backend |
| `showSearch` | `boolean` | `true` | Show search bar |
| `showDateRange` | `boolean` | `false` | Show 1D/1W/1M/3M/6M/1Y date-range links |
| `showCheckboxes` | `boolean` | `false` | Bulk-select column |
| `showStatusToggle` | `boolean` | `false` | Show STATUS column with toggle switch |
| `statusKey` | `string` | `'active'` | Row property key for the toggle |
| `searchPlaceholder` | `string` | `'Search...'` | Placeholder for search input |
| `loading` | `boolean` | `false` | Show shimmer skeleton rows |

---

## 4. All `@Output()` Emitters

| Output | Payload type | When it fires |
|---|---|---|
| `onView` | `any` (row) | View icon clicked |
| `onEdit` | `any` (row) | Edit icon clicked |
| `onDelete` | `any` (row) | Delete icon clicked |
| `onSecondaryAction` | `{ key: string, row: any }` | Kebab menu item clicked |
| `onExport` | `string` (key) | Export button/item clicked |
| `onPageChange` | `number` | Page number clicked → **parent calls API** |
| `onItemsPerPageChange` | `number` | Rows-per-page dropdown changed |
| `onFilterApply` | `Record<string, any>` | "Apply Filters" clicked |
| `onFilterClear` | `void` | "Clear Filters" clicked |
| `onStatusToggle` | `{ row: any, value: boolean }` | Status toggle flipped |
| `onSearch` | `string` | Search input changed |
| `onSort` | `{ key: string, direction: 'asc'\|'desc' }` | Sortable column header clicked |

---

## 5. Type Definitions

```ts
interface TableColumn {
  key: string;            // matches row object property
  label: string;          // header display text
  sortable?: boolean;     // show sort arrows
  type?: 'text' | 'badge' | 'date' | 'number' | 'custom';
  minWidth?: string;      // e.g. '120px'
}

interface PrimaryAction {
  type: 'view' | 'edit' | 'delete';
  label?: string;         // tooltip override
}

interface SecondaryAction {
  key: string;            // emitted in onSecondaryAction
  label: string;          // menu item label
  svgPath: string;        // SVG <path d="..."> attribute
  viewBox?: string;       // defaults to "0 0 24 24"
}

interface ExportOption {
  key: string;            // emitted in onExport
  label: string;
  svgPath: string;
  viewBox?: string;
}

type FilterType = 'checkbox' | 'radio' | 'input' | 'dropdown' | 'multiselect';

interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  options?: { label: string; value: any }[];   // for checkbox/radio/dropdown/multiselect
  placeholder?: string;                         // for input/dropdown
}

interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}
```

---

## 6. Full Usage Example

### Component (TypeScript)

```ts
import { Component } from '@angular/core';
import {
  TableColumn, PrimaryAction, SecondaryAction,
  ExportOption, FilterConfig, PaginationConfig
} from '@libs/table';

@Component({ template: `...` })
export class OrdersPageComponent {

  columns: TableColumn[] = [
    { key: 'orderId',  label: 'Order ID',  sortable: true },
    { key: 'vendor',   label: 'Vendor' },
    { key: 'date',     label: 'Date' },
    { key: 'amount',   label: 'Amount' },
    { key: 'status',   label: 'Status',   type: 'badge' },
    { key: 'assignee', label: 'Assignee', sortable: true },
  ];

  data: any[] = []; // filled from API

  primaryActions: PrimaryAction[] = [
    { type: 'view' },
    { type: 'edit' },
    { type: 'delete' },
  ];

  secondaryActions: SecondaryAction[] = [
    {
      key: 'approve',
      label: 'Approve Order',
      svgPath: 'M20 6L9 17l-5-5',
    },
    {
      key: 'print',
      label: 'Print',
      svgPath: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
    },
  ];

  // Single export → plain button
  exportOptions: ExportOption[] = [
    {
      key: 'csv',
      label: 'Export CSV',
      svgPath: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    },
  ];

  // Multiple exports → floating menu
  exportOptions: ExportOption[] = [
    {
      key: 'csv',
      label: 'Export as CSV',
      svgPath: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
    },
    {
      key: 'excel',
      label: 'Export as Excel',
      svgPath: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      svgPath: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8M16 17H8M10 9H8',
    },
  ];

  filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Verification Status',
      type: 'checkbox',
      options: [
        { label: 'Verified', value: 'verified' },
        { label: 'Pending',  value: 'pending' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      key: 'affiliation',
      label: 'Recruiter Affiliation',
      type: 'radio',
      options: [
        { label: 'All',             value: 'all' },
        { label: 'Recruiters Only', value: 'recruiters' },
        { label: 'Non-Recruiters',  value: 'non_recruiters' },
      ],
    },
    {
      key: 'location',
      label: 'Location',
      type: 'input',
      placeholder: 'City, State, or Country',
    },
    {
      key: 'department',
      label: 'Department',
      type: 'dropdown',
      placeholder: 'Select department...',
      options: [
        { label: 'Engineering', value: 'eng' },
        { label: 'Marketing',   value: 'mkt' },
        { label: 'Finance',     value: 'fin' },
      ],
    },
    {
      key: 'tags',
      label: 'Tags',
      type: 'multiselect',
      options: [
        { label: 'Remote',     value: 'remote' },
        { label: 'Full-time',  value: 'fulltime' },
        { label: 'Internship', value: 'intern' },
        { label: 'Contract',   value: 'contract' },
      ],
    },
  ];

  pagination: PaginationConfig = {
    currentPage: 1,
    totalPages: 3,
    itemsPerPage: 10,
    totalItems: 25,
  };

  // ── Handlers (parent makes the actual API calls) ────────────────

  onPageChange(page: number) {
    this.pagination = { ...this.pagination, currentPage: page };
    this.fetchData();
  }

  onItemsPerPageChange(n: number) {
    this.pagination = { ...this.pagination, itemsPerPage: n, currentPage: 1 };
    this.fetchData();
  }

  onFilterApply(filters: Record<string, any>) {
    this.activeFilters = filters;
    this.fetchData();
  }

  onFilterClear() {
    this.activeFilters = {};
    this.fetchData();
  }

  onExport(key: string) {
    if (key === 'csv')   this.exportCsv();
    if (key === 'excel') this.exportExcel();
    if (key === 'pdf')   this.exportPdf();
  }

  onView(row: any)              { /* open detail modal */ }
  onEdit(row: any)              { /* open edit form */ }
  onDelete(row: any)            { /* show confirm dialog */ }

  onSecondaryAction({ key, row }: { key: string; row: any }) {
    if (key === 'approve') { /* approve logic */ }
    if (key === 'print')   { /* print logic */ }
  }

  onStatusToggle({ row, value }: { row: any; value: boolean }) {
    // call API to update status
    this.apiService.updateStatus(row.id, value).subscribe(() => {
      row.isActive = value; // reflect change locally
    });
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.fetchData();
  }

  onSort({ key, direction }: { key: string; direction: 'asc' | 'desc' }) {
    this.sortKey = key;
    this.sortDir = direction;
    this.fetchData();
  }

  fetchData() { /* call your API service */ }
}
```

### Template (HTML)

```html
<lib-table
  [columns]="columns"
  [data]="data"
  [loading]="loading"

  [primaryActions]="primaryActions"
  [secondaryActions]="secondaryActions"

  [exportOptions]="exportOptions"

  [filters]="filters"

  [pagination]="pagination"
  [showSearch]="true"
  [showDateRange]="true"
  [showCheckboxes]="true"
  [showStatusToggle]="true"
  statusKey="isActive"
  searchPlaceholder="Search orders, vendors..."

  (onView)="onView($event)"
  (onEdit)="onEdit($event)"
  (onDelete)="onDelete($event)"
  (onSecondaryAction)="onSecondaryAction($event)"
  (onExport)="onExport($event)"
  (onPageChange)="onPageChange($event)"
  (onItemsPerPageChange)="onItemsPerPageChange($event)"
  (onFilterApply)="onFilterApply($event)"
  (onFilterClear)="onFilterClear()"
  (onStatusToggle)="onStatusToggle($event)"
  (onSearch)="onSearch($event)"
  (onSort)="onSort($event)"
></lib-table>
```

---

## 7. Badge Status Colors

When a column uses `type: 'badge'`, the cell value is lowercased and matched against built-in color mappings:

| Value | Colour |
|---|---|
| `pending` | Amber |
| `shipped` | Blue |
| `delivered` | Green |
| `approved` | Teal |
| `cancelled` | Red |
| `active` | Green |
| `inactive` | Grey |
| `rejected` | Red |
| `verified` | Green |

Any other value falls back to a neutral grey. You can extend custom statuses in your own CSS by targeting `.kjt-badge[data-status="yourvalue"]`.

---

## 8. Backend Pagination Flow

1. Parent initialises `pagination` object from initial API response.
2. User clicks a page number → `(onPageChange)` emits the page.
3. Parent calls the API with the new page number.
4. Parent updates `[data]` and `[pagination]` inputs.
5. Table re-renders with the new data — no logic inside the library.

Same flow applies to `(onItemsPerPageChange)`, `(onFilterApply)`, and `(onSort)`.

---

## 9. SVG Path Tips

Use any Heroicons / Feather Icons path. Just copy the `d="..."` attribute value from the SVG source and pass it as `svgPath`. The library renders it inside a 24×24 viewBox by default. Pass `viewBox` to override.

```ts
// Example: Feather "send" icon
{
  key: 'send',
  label: 'Send',
  svgPath: 'M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z',
}
```

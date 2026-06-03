/**
 * @libs/table — Model definitions
 * All interfaces and types used by the TableComponent.
 */

/** Configuration for stacked sub-fields within a single column */
export interface SubField {
  /** Data key to read from the row object */
  key: string;
  /** Rendering hint for this specific subfield value */
  type: 'text' | 'badge';
  /** Mapping of data values to CSS colors (e.g., {'Active': '#10b981', 'Pending': '#f59e0b'}) */
  colorMap?: Record<string, string>;
  /** Fallback color if the value isn't in colorMap or for default badges */
  defaultColor?: string;
  /** Add a prefix label before the text/badge */
  prefix?: string;
}

/** Single column definition */
export interface TableColumn {
  /** Data key to read from each row object */
  key: string;
  /** Display label in the table header */
  label: string;
  /** Allow sorting on this column (shows sort arrows) */
  sortable?: boolean;
  /** Rendering hint for the cell content */
  type?: 'text' | 'badge' | 'date' | 'number' | 'custom' | 'stacked';
  /** Mapping of data values to CSS colors (e.g., {'Active': {bg: '#10b981', text: '#fff'}}) */
  colorMap?: Record<string, { bg: string, text: string }>;
  /** Fallback color if the value isn't in colorMap or for default badges */
  defaultColor?: { bg: string, text: string };
  /** Only used when type is 'stacked'. Renders fields underneath the primary value */
  subFields?: SubField[];
  /** Minimum width, e.g. '120px' */
  minWidth?: string;
  /** Fixed width, e.g. '150px'. Enforces consistency even when content changes. */
  width?: string;
}

/** Which primary actions to show on each row */
export interface PrimaryAction {
  /** Pre-defined generic types or 'custom' for user-defined actions */
  type: 'view' | 'edit' | 'delete' | 'custom' | string;
  /** Unique key emitted when action is clicked, useful for 'custom' type */
  actionKey?: string;
  /** Custom SVG <path> mapped over a 24x24 viewBox (can override preset icons) */
  svgPath?: string;
  /** viewBox for the SVG, defaults to "0 0 24 24" */
  viewBox?: string;
  /** Tooltip label, defaults to the type name */
  label?: string;
  /** Visual theme for the button */
  theme?: 'primary' | 'secondary' | 'alert' | 'success';
}

/** A custom SVG icon button inside the row actions */
export interface SecondaryAction {
  /** Unique key emitted when action is clicked */
  key: string;
  /** Tooltip / menu label */
  label: string;
  /** SVG <path> `d` attribute for the icon */
  svgPath: string;
  /** viewBox for the SVG, defaults to "0 0 24 24" */
  viewBox?: string;
}

/** Single item in the export menu */
export interface ExportOption {
  /** Unique key emitted when this export is chosen */
  key: string;
  /** Button / menu label */
  label: string;
  /** SVG <path> `d` attribute for the icon */
  svgPath: string;
  /** viewBox for the SVG, defaults to "0 0 24 24" */
  viewBox?: string;
}

/** Filter control types */
export type FilterType = 'checkbox' | 'radio' | 'input' | 'dropdown' | 'multiselect' | 'multidropdown' | 'singleselect';

/** A single option within a filter */
export interface FilterOption {
  label: string;
  value: any;
}

/** Configuration for one filter control in the slide-in panel */
export interface FilterConfig {
  /** Unique key used in the emitted filter map */
  key: string;
  /** Section heading in the panel */
  label: string;
  /** Control type to render */
  type: FilterType;
  /** Options list — used by checkbox, radio, dropdown, multiselect */
  options?: FilterOption[];
  /** Placeholder text — for input and dropdown */
  placeholder?: string;
}

/** Backend-driven pagination state — the parent owns and updates this */
export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

/** Payload emitted when a secondary action is clicked */
export interface SecondaryActionEvent {
  key: string;
  row: any;
}

/** Payload emitted when the status toggle is flipped */
export interface StatusToggleEvent {
  row: any;
  value: boolean;
}

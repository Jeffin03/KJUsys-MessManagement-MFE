/**
 * Represents a single tab item within the tabs component.
 */
export interface TabItem {
  /** Unique identifier for the tab, used for selection logic. */
  id: string;
  
  /** The primary text displayed on the tab. */
  label: string;
  
  /** Optional secondary text displayed below the label in a smaller font. */
  subtitle?: string;
  
  /** Optional numeric indicator for notifications or item counts. */
  count?: number;
}

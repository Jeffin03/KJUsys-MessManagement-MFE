/**
 * Represents a single tab entry in the sub-navigation library.
 */
export interface SubTabItem {
  /** 
   * Unique identifier for the tab. 
   * This value is emitted by the (tabChange) event when the tab is clicked.
   */
  id: string;
  
  /** 
   * The text label displayed on the tab in the UI. 
   */
  label: string;

  /** 
   * Optional numeric indicator for notifications or item counts. 
   */
  count?: number;
}

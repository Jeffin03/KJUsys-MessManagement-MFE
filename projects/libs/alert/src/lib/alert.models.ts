export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * Represents the configuration options for an alert.
 */
export interface AlertConfig {
  /** Unique identifier for the alert. If not provided, one will be generated. */
  id?: string;
  /** The visual type of the alert which determines its color and icon. */
  type: AlertType;
  /** The primary message content of the alert. */
  message: string;
  /** Optional bold heading to display above the message. */
  heading?: string;
  /** 
   * Optional text for an action button. 
   * If provided, the alert will not auto-dismiss and will remain until the action is clicked. 
   */
  actionButtonText?: string;
  /** 
   * Optional callback function that triggers when the action button is clicked. 
   * @param alertId The ID of the alert being interacted with.
   */
  actionCallback?: (alertId: string) => void;
  /** 
   * Duration in milliseconds before the alert auto-dismisses. 
   * Only applicable if no action button is provided. 
   */
  duration?: number;
}

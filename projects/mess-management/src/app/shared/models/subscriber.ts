/**
 * Subscriber model representing a mess subscriber in the frontend.
 *
 * Backend stores `class` and `div` as separate fields. The frontend combines
 * them into `classSection` (e.g. "II A") for display in the subscriber table
 * and CSV export. The separate `class`/`div` fields are kept for backward
 * compatibility with the edit form which splits them back via `splitClassSection()`.
 */
export interface Subscriber {
  /** Unique subscriber ID from MongoDB (`_id.$oid`). */
  id: string | number;
  /** Student full name (single field — first + last name combined). */
  name: string;
  /** Admission number (uppercase, unique). */
  admission_number: string;
  /** Hostel name (may be empty for day scholars). */
  hostel_name: string;
  /** Hostel warden name. */
  hostel_warden: string;
  /** Class / grade (e.g. "II"). Stored separately in backend. */
  class: string;
  /** Section (e.g. "A"). Stored separately in backend. */
  div: string;
  /** Combined class + section for table display and CSV export (e.g. "II A"). */
  classSection: string;
  /** Meal plan summary (e.g. "BRK+LNCH") or "Super User" / "None". */
  mealPlan: string;
  /** Subscription status: 'Active', 'Paused', 'Lapsed', or 'Super User'. */
  status: string;
  /** Join date formatted as "DD Mon YY" (e.g. "10 Jan 26"). */
  joinedDate: string;

  // ── Edit-form fields (populated only when editing) ──────────────────
  /** Subscription start date in DD/MM/YY format for the edit form. */
  startDate?: string;
  /** Subscription end date in DD/MM/YY format for the edit form. */
  endDate?: string;
  /** Pause end date in DD/MM/YY format for the edit form. */
  pauseEndDate?: string;
  /** Pause start date in DD/MM/YY format for the edit form. */
  pauseStartDate?: string;
  /** Reason for the current pause. */
  pauseReason?: string;
  /** Raw meal slot names from backend (e.g. ["BREAKFAST", "LUNCH"]). */
  mealNames?: string[];
  /** Expiry warning text (e.g. "expires in 3 days") — empty for super users. */
  expiryWarning?: string;
  /** Day preference: 'all', 'weekday', or 'weekend'. */
  dayPreference?: string;
  /** Whether this subscriber is a super user (bypasses subscription checks). */
  superUser?: boolean;
}